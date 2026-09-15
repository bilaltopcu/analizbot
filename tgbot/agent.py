"""
agent.py – Gemini ile GitHub arasında köprü kuran AI agent katmanı.

Büyük dosya stratejisi (>8000 karakter):
  - Gemini'ye sadece baş+son özet gösterilir
  - Gemini'den search/replace patch çiftleri istenir
  - Commit sırasında GitHub'dan tam dosya çekilip patch uygulanır
Küçük dosyalar için Gemini tam içerik yazar.
"""
from __future__ import annotations

import base64
import difflib
import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

import httpx
from github import Github, GithubException, InputGitTreeElement

from config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GITHUB_BRANCH,
    GITHUB_REPO,
    GITHUB_TOKEN,
    MAX_CONTEXT_CHARS,
    READABLE_EXTENSIONS,
    SKIP_DIRS,
)

log = logging.getLogger(__name__)

_gh   = Github(GITHUB_TOKEN)
_repo = _gh.get_repo(GITHUB_REPO)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

LARGE_FILE_THRESHOLD = 8000  # karakterde büyük dosya eşiği


# ── Veri sınıfları ─────────────────────────────────────────────────────────────
@dataclass
class FileChange:
    path: str
    old_content: str
    new_content: str

    @property
    def diff_summary(self) -> str:
        old_lines = self.old_content.splitlines(keepends=True)
        new_lines = self.new_content.splitlines(keepends=True)
        diff = list(
            difflib.unified_diff(
                old_lines, new_lines,
                fromfile=f"a/{self.path}",
                tofile=f"b/{self.path}",
                n=2,
            )
        )
        if len(diff) > 60:
            diff = diff[:60] + ["...(kısaltıldı)\n"]
        return "".join(diff)


@dataclass
class AgentResult:
    changes: list[FileChange] = field(default_factory=list)
    commit_message: str = ""
    commit_hash: Optional[str] = None
    error: Optional[str] = None
    debug_raw: Optional[str] = None

    @property
    def diff_text(self) -> str:
        parts = [f.diff_summary for f in self.changes]
        return "\n".join(parts) or "(değişiklik yok)"


# ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────────

def _build_file_tree(tree_items) -> str:
    lines: list[str] = []
    for item in tree_items:
        parts = item.path.split("/")
        if any(p in SKIP_DIRS for p in parts):
            continue
        size_tag = f" [{(item.size or 0)//1024}KB - BÜYÜK DOSYA]" if (item.size or 0) > 20000 else ""
        lines.append(f"{item.path}{size_tag}")
    return "\n".join(lines)


def _fetch_file_full(path: str) -> str:
    """GitHub'dan bir dosyanın tam içeriğini çek."""
    content_obj = _repo.get_contents(path, ref=GITHUB_BRANCH)
    raw = base64.b64decode(content_obj.content)  # type: ignore[union-attr]
    return raw.decode("utf-8", errors="replace")


def _fetch_context(user_prompt: str) -> tuple[str, dict[str, str]]:
    """
    Döndürür:
      tree_text     - Dosya ağacı metni
      file_previews - Gemini'ye gönderilecek içerikler (büyükler kısaltılmış)
    """
    git_tree = _repo.get_git_tree(GITHUB_BRANCH, recursive=True)
    tree_text = _build_file_tree(git_tree.tree)

    readable = [
        item for item in git_tree.tree
        if item.type == "blob"
        and any(item.path.endswith(ext) for ext in READABLE_EXTENSIONS)
        and not any(p in SKIP_DIRS for p in item.path.split("/"))
    ]

    file_previews: dict[str, str] = {}
    budget = MAX_CONTEXT_CHARS

    for item in sorted(readable, key=lambda x: x.size or 0):
        if budget <= 0:
            break
        try:
            blob = _repo.get_git_blob(item.sha)
            raw  = base64.b64decode(blob.content).decode("utf-8", errors="replace")

            if len(raw) > LARGE_FILE_THRESHOLD:
                head    = raw[:3000]
                tail    = raw[-1500:]
                preview = (
                    f"{head}\n\n"
                    f"... [BÜYÜK DOSYA - ORTA KISIM ATILDI. Toplam: {len(raw)} karakter] ...\n\n"
                    f"{tail}"
                )
                snippet = preview[:5000]
                file_previews[item.path] = snippet
                budget -= 5000
            else:
                snippet = raw[:budget]
                file_previews[item.path] = snippet
                budget -= len(snippet)

        except Exception as exc:
            log.warning("Dosya okunamadı %s: %s", item.path, exc)

    return tree_text, file_previews


def _build_prompt(user_prompt: str, tree_text: str, file_previews: dict[str, str]) -> str:
    file_section = "\n\n".join(
        f"### {path}\n```\n{content}\n```"
        for path, content in file_previews.items()
    )
    return f"""Sen bir otonom kod editörüsün. Sana GitHub deposunun dosya ağacı ve içerikleri verildi.
Kullanıcının doğal dil komutunu uygula.

KURALLAR:
1. Küçük dosyalar için (BÜYÜK DOSYA etiketi olmayan): "content" alanına TAM yeni içeriği yaz.
2. Büyük dosyalar için (BÜYÜK DOSYA etiketi olanlar): "content" null bırak, "patches" kullan:
   patches: [{{"search": "değiştirilecek orijinal metin", "replace": "yeni metin"}}]
   - search alanı dosyada AYNEN geçen bir metin parçası olmalı (tam eşleşme)
   - Birden fazla patch ekleyebilirsin
3. commit_message 72 karakteri geçmesin.
4. SADECE JSON döndür, başka hiçbir şey yazma.

JSON formatı:
{{
  "files": [
    {{"path": "kucuk.js", "content": "yeni tam içerik", "patches": null}},
    {{"path": "buyuk.css", "content": null, "patches": [{{"search": "eski metin", "replace": "yeni metin"}}]}}
  ],
  "commit_message": "kısa commit mesajı"
}}

## Dosya Ağacı
{tree_text}

## Dosya İçerikleri
{file_section}

## Kullanıcı Komutu
{user_prompt}
"""


async def _call_gemini(prompt: str) -> str:
    """503/429 için exponential backoff ile Gemini HTTP API çağrısı."""
    import asyncio

    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }

    wait_times = [5, 15, 30, 60]
    async with httpx.AsyncClient(timeout=180) as client:
        for attempt, wait in enumerate(wait_times, start=1):
            resp = await client.post(GEMINI_URL, headers=headers, json=body)
            if resp.status_code == 200:
                break
            if resp.status_code in (429, 503) and attempt < len(wait_times):
                log.warning("Gemini %d (deneme %d/%d) → %ds bekleniyor...",
                            resp.status_code, attempt, len(wait_times), wait)
                await asyncio.sleep(wait)
                continue
            raise ValueError(f"Gemini HTTP {resp.status_code}: {resp.text[:400]}")

    data = resp.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        raise ValueError(f"Gemini yanıt yapısı beklenmedik: {json.dumps(data)[:300]}") from e


def _apply_patches(original: str, patches: list[dict]) -> str:
    """search/replace patch listesini orijinal metne uygula."""
    result = original
    for i, patch in enumerate(patches):
        search  = patch.get("search", "")
        replace = patch.get("replace", "")
        if not search:
            continue
        if search not in result:
            log.warning("Patch #%d hedefi bulunamadı, atlanıyor: %s", i, repr(search[:80]))
            continue
        result = result.replace(search, replace, 1)
        log.info("Patch #%d uygulandı: %s → %s", i, repr(search[:40]), repr(replace[:40]))
    return result


def _parse_gemini_response(text: str) -> tuple[list[dict], str]:
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()
    start = cleaned.find("{")
    end   = cleaned.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"JSON bulunamadı. Ham yanıt:\n{text[:400]}")
    data = json.loads(cleaned[start:end])
    return data.get("files", []), data.get("commit_message", "chore: update files")


# ── Ana agent fonksiyonları ────────────────────────────────────────────────────

async def analyze(user_prompt: str) -> AgentResult:
    result = AgentResult()
    try:
        log.info("Bağlam çekiliyor...")
        tree_text, file_previews = _fetch_context(user_prompt)
        log.info("%d dosya önizlemesi yüklendi", len(file_previews))

        log.info("Gemini çağrılıyor... model=%s", GEMINI_MODEL)
        prompt = _build_prompt(user_prompt, tree_text, file_previews)
        raw    = await _call_gemini(prompt)

        result.debug_raw = raw[:1000]
        log.info("Gemini yanıtı (ilk 400 karakter):\n%s", raw[:400])

        if not raw or not raw.strip():
            result.error = "❌ Gemini boş yanıt döndürdü."
            return result

        files_spec, commit_msg = _parse_gemini_response(raw)
        result.commit_message = commit_msg
        log.info("Parse: %d dosya, commit: %s", len(files_spec), commit_msg)

        for spec in files_spec:
            path    = spec.get("path", "").strip()
            content = spec.get("content")   # None = patch modu
            patches = spec.get("patches") or []

            if not path:
                continue

            # Orijinal içeriği GitHub'dan çek
            try:
                original = _fetch_file_full(path)
            except Exception:
                original = file_previews.get(path, "")

            if patches:
                log.info("Patch modu: %s (%d patch)", path, len(patches))
                new_content = _apply_patches(original, patches)
            elif content:
                log.info("Tam içerik modu: %s", path)
                new_content = content
            else:
                log.warning("%s için content ve patch yok, atlanıyor.", path)
                continue

            result.changes.append(FileChange(path, original, new_content))

    except json.JSONDecodeError as exc:
        result.error = (
            f"❌ Gemini geçersiz JSON döndürdü:\n`{exc}`\n\n"
            f"Ham yanıt:\n```\n{result.debug_raw or 'yok'}\n```"
        )
    except Exception as exc:
        log.exception("analyze() hatası")
        result.error = str(exc)

    return result


async def commit_changes(result: AgentResult) -> AgentResult:
    """Değişiklikleri GitHub'a Git Tree API ile commit et."""
    if result.error or not result.changes:
        result.error = result.error or "Commit edilecek değişiklik yok."
        return result

    try:
        ref       = _repo.get_git_ref(f"heads/{GITHUB_BRANCH}")
        head_sha  = ref.object.sha
        base_tree = _repo.get_git_commit(head_sha).tree

        tree_elements = []
        for change in result.changes:
            log.info("Blob: %s (%d karakter)", change.path, len(change.new_content))
            blob = _repo.create_git_blob(change.new_content, "utf-8")
            tree_elements.append(
                InputGitTreeElement(
                    path=change.path,
                    mode="100644",
                    type="blob",
                    sha=blob.sha,
                )
            )

        new_tree   = _repo.create_git_tree(tree_elements, base_tree)
        new_commit = _repo.create_git_commit(
            message=result.commit_message,
            tree=new_tree,
            parents=[_repo.get_git_commit(head_sha)],
        )
        ref.edit(new_commit.sha)
        result.commit_hash = new_commit.sha[:7]
        log.info("✅ Commit başarılı: %s", result.commit_hash)

    except GithubException as exc:
        msg = exc.data if isinstance(exc.data, str) else exc.data.get("message", str(exc.data))
        result.error = f"❌ GitHub API hatası:\n`{msg}`\nStatus: {exc.status}"
    except Exception as exc:
        log.exception("commit_changes() hatası")
        result.error = f"❌ Commit hatası: {exc}"

    return result
