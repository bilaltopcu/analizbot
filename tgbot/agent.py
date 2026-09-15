"""
agent.py – Gemini ile GitHub arasında köprü kuran AI agent katmanı.
HTTP API ile doğrudan Gemini çağrısı yapar (AQ. key uyumlu).
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
from github import Github, GithubException

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

# ── GitHub kurulumu ────────────────────────────────────────────────────────────
_gh   = Github(GITHUB_TOKEN)
_repo = _gh.get_repo(GITHUB_REPO)

# ── Gemini HTTP endpoint ───────────────────────────────────────────────────────
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)


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
    debug_raw: Optional[str] = None  # Gemini ham yanıtı (debug için)

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
        lines.append(item.path)
    return "\n".join(lines)


def _fetch_context(user_prompt: str) -> tuple[str, dict[str, str]]:
    git_tree = _repo.get_git_tree(GITHUB_BRANCH, recursive=True)
    tree_text = _build_file_tree(git_tree.tree)

    readable = [
        item for item in git_tree.tree
        if item.type == "blob"
        and any(item.path.endswith(ext) for ext in READABLE_EXTENSIONS)
        and not any(p in SKIP_DIRS for p in item.path.split("/"))
    ]

    file_contents: dict[str, str] = {}
    budget = MAX_CONTEXT_CHARS
    for item in sorted(readable, key=lambda x: x.size or 0):
        if budget <= 0:
            break
        try:
            blob = _repo.get_git_blob(item.sha)
            raw = base64.b64decode(blob.content).decode("utf-8", errors="replace")
            snippet = raw[:budget]
            file_contents[item.path] = snippet
            budget -= len(snippet)
        except Exception as exc:
            log.warning("Dosya okunamadı %s: %s", item.path, exc)

    return tree_text, file_contents


def _build_prompt(user_prompt: str, tree_text: str, file_contents: dict[str, str]) -> str:
    file_section = "\n\n".join(
        f"### {path}\n```\n{content}\n```"
        for path, content in file_contents.items()
    )
    return f"""Sen bir otonom kod editörüsün. Sana GitHub deposunun dosya ağacı ve içerikleri verildi.
Kullanıcının doğal dil komutunu uygula.

SADECE ve YALNIZCA aşağıdaki JSON formatında yanıt ver. Başka hiçbir şey yazma:

{{"files": [{{"path": "dosya_yolu", "content": "dosyanın yeni tam içeriği"}}], "commit_message": "kısa commit mesajı"}}

Kurallar:
- Değiştirilmeyecek dosyaları ekleme.
- Tam dosya içeriğini ver.
- JSON dışında HİÇBİR şey yazma, açıklama yapma.

## Dosya Ağacı
{tree_text}

## Dosya İçerikleri
{file_section}

## Kullanıcı Komutu
{user_prompt}
"""


async def _call_gemini(prompt: str) -> str:
    """Gemini API'ye doğrudan HTTP ile istek at.
    503 / 429 hatalarında exponential backoff ile yeniden dener.
    """
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

    wait_times = [5, 15, 30, 60]   # saniye cinsinden bekleme süresi

    async with httpx.AsyncClient(timeout=180) as client:
        for attempt, wait in enumerate(wait_times, start=1):
            resp = await client.post(GEMINI_URL, headers=headers, json=body)

            if resp.status_code == 200:
                break

            # Yeniden denenebilir hatalar: 429 (rate limit) veya 503 (aşırı yük)
            if resp.status_code in (429, 503) and attempt < len(wait_times):
                log.warning(
                    "Gemini %d hatası (deneme %d/%d). %ds bekleniyor...",
                    resp.status_code, attempt, len(wait_times), wait,
                )
                await asyncio.sleep(wait)
                continue

            # Diğer hatalar veya son deneme
            raise ValueError(f"Gemini HTTP {resp.status_code}: {resp.text[:400]}")

    data = resp.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as e:
        log.error("Gemini yanıt yapısı beklenmedik: %s", json.dumps(data)[:400])
        raise ValueError(f"Gemini yanıt yapısı beklenmedik: {json.dumps(data)[:300]}") from e


def _parse_gemini_response(text: str) -> tuple[list[dict], str]:
    """Gemini yanıtından JSON'u çıkar."""
    # Markdown kod bloğunu temizle
    cleaned = re.sub(r"```(?:json)?", "", text).replace("```", "").strip()

    # İlk { bloğundan son } bloğuna kadar al
    start = cleaned.find("{")
    end   = cleaned.rfind("}") + 1
    if start == -1 or end == 0:
        raise ValueError(f"JSON bulunamadı. Ham yanıt:\n{text[:400]}")

    json_str = cleaned[start:end]
    data = json.loads(json_str)
    return data.get("files", []), data.get("commit_message", "chore: update files")


# ── Ana agent fonksiyonları ────────────────────────────────────────────────────

async def analyze(user_prompt: str) -> AgentResult:
    result = AgentResult()
    try:
        log.info("Bağlam çekiliyor...")
        tree_text, file_contents = _fetch_context(user_prompt)
        log.info("%d dosya içeriği yüklendi, ağaç %d satır",
                 len(file_contents), tree_text.count("\n"))

        log.info("Gemini çağrılıyor... model=%s", GEMINI_MODEL)
        prompt = _build_prompt(user_prompt, tree_text, file_contents)
        raw = await _call_gemini(prompt)

        result.debug_raw = raw[:1000]
        log.info("Gemini yanıtı (ilk 400 karakter):\n%s", raw[:400])

        if not raw or not raw.strip():
            result.error = "❌ Gemini boş yanıt döndürdü."
            return result

        files_spec, commit_msg = _parse_gemini_response(raw)
        result.commit_message = commit_msg
        log.info("Parse edildi: %d dosya değişikliği, commit: %s",
                 len(files_spec), commit_msg)

        for spec in files_spec:
            path        = spec.get("path", "").strip()
            new_content = spec.get("content", "")
            if not path or not new_content:
                continue
            old_content = file_contents.get(path, "")
            result.changes.append(FileChange(path, old_content, new_content))

    except json.JSONDecodeError as exc:
        log.error("JSON parse hatası: %s", exc)
        result.error = (
            f"❌ Gemini geçersiz JSON döndürdü:\n`{exc}`\n\n"
            f"Ham yanıt:\n```\n{result.debug_raw or 'yok'}\n```"
        )
    except Exception as exc:
        log.exception("analyze() hatası")
        result.error = str(exc)

    return result


async def commit_changes(result: AgentResult) -> AgentResult:
    """Değişiklikleri GitHub'a commit et (Git Tree API)."""
    if result.error or not result.changes:
        result.error = result.error or "Commit edilecek değişiklik yok."
        return result

    try:
        from github import InputGitTreeElement

        ref       = _repo.get_git_ref(f"heads/{GITHUB_BRANCH}")
        head_sha  = ref.object.sha
        base_tree = _repo.get_git_commit(head_sha).tree

        # Her dosya için InputGitTreeElement oluştur
        tree_elements = []
        for change in result.changes:
            log.info("Blob oluşturuluyor: %s (%d karakter)", change.path, len(change.new_content))
            blob = _repo.create_git_blob(change.new_content, "utf-8")
            tree_elements.append(
                InputGitTreeElement(
                    path=change.path,
                    mode="100644",
                    type="blob",
                    sha=blob.sha,
                )
            )
            log.info("Blob tamam: %s → %s", change.path, blob.sha[:8])

        log.info("Git tree oluşturuluyor (%d eleman)...", len(tree_elements))
        new_tree = _repo.create_git_tree(tree_elements, base_tree)

        log.info("Commit oluşturuluyor: %s", result.commit_message)
        new_commit = _repo.create_git_commit(
            message=result.commit_message,
            tree=new_tree,
            parents=[_repo.get_git_commit(head_sha)],
        )

        log.info("Branch güncelleniyor: %s → %s", GITHUB_BRANCH, new_commit.sha[:8])
        ref.edit(new_commit.sha)
        result.commit_hash = new_commit.sha[:7]
        log.info("✅ Commit başarılı: %s", result.commit_hash)

    except GithubException as exc:
        # exc.data bir dict olabilir — temiz mesaj çıkar
        msg = exc.data if isinstance(exc.data, str) else exc.data.get("message", str(exc.data))
        log.exception("GitHub commit hatası: %s", msg)
        result.error = f"❌ GitHub API hatası:\n`{msg}`\nStatus: {exc.status}"
    except Exception as exc:
        log.exception("commit_changes() beklenmeyen hata")
        result.error = f"❌ Commit hatası: {exc}"

    return result
