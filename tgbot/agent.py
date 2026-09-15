"""
agent.py – Gemini ile GitHub arasında köprü kuran AI agent katmanı.

Sorumluluklar:
  1. GitHub reposunun dosya ağacını çek.
  2. İlgili dosya içeriklerini oku.
  3. Gemini'ye tüm bağlamı + kullanıcı komutunu ver.
  4. Gemini'nin döndürdüğü JSON yanıtını parse et:
       { "files": [{"path": "...", "content": "..."}], "commit_message": "..." }
  5. Diff özetini döndür (bot.py onay sorar, sonra commit ister).
  6. GitHub'a değişiklikleri commit'le.
"""
from __future__ import annotations

import difflib
import json
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

import google.generativeai as genai
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

# ── Gemini kurulumu ────────────────────────────────────────────────────────────
genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel(GEMINI_MODEL)

# ── GitHub kurulumu ────────────────────────────────────────────────────────────
_gh   = Github(GITHUB_TOKEN)
_repo = _gh.get_repo(GITHUB_REPO)


# ── Veri sınıfları ─────────────────────────────────────────────────────────────
@dataclass
class FileChange:
    path: str
    old_content: str
    new_content: str

    @property
    def diff_summary(self) -> str:
        """Kısa birleşik diff metni döndür (max 60 satır)."""
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

    @property
    def diff_text(self) -> str:
        parts = [f.diff_summary for f in self.changes]
        return "\n".join(parts) or "(değişiklik yok)"


# ── Yardımcı fonksiyonlar ──────────────────────────────────────────────────────

def _build_file_tree(tree_items) -> str:
    """GitHub tree öğelerinden metin ağacı oluştur."""
    lines: list[str] = []
    for item in tree_items:
        parts = item.path.split("/")
        # SKIP_DIRS ile başlayan yolları atla
        if any(p in SKIP_DIRS for p in parts):
            continue
        lines.append(item.path)
    return "\n".join(lines)


def _fetch_context(user_prompt: str) -> tuple[str, dict[str, str]]:
    """
    Dosya ağacını ve alakalı dosya içeriklerini çek.
    Döndürür: (tree_text, {path: content})
    """
    git_tree = _repo.get_git_tree(GITHUB_BRANCH, recursive=True)
    tree_text = _build_file_tree(git_tree.tree)

    # Sadece okunabilir uzantılı dosyaları al
    readable = [
        item for item in git_tree.tree
        if item.type == "blob"
        and any(item.path.endswith(ext) for ext in READABLE_EXTENSIONS)
        and not any(p in SKIP_DIRS for p in item.path.split("/"))
    ]

    # Toplam karakter bütçesi – en büyük dosyaları öncelikle oku
    file_contents: dict[str, str] = {}
    budget = MAX_CONTEXT_CHARS
    for item in sorted(readable, key=lambda x: x.size or 0):
        if budget <= 0:
            break
        try:
            blob = _repo.get_git_blob(item.sha)
            import base64
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
    return f"""Sen bir otonom kod editörüsün. Sana aşağıdaki GitHub deposunun dosya ağacı ve içerikleri verildi.
Kullanıcının doğal dil komutunu uygula ve YALNIZCA aşağıdaki JSON formatında cevap ver:

{{
  "files": [
    {{"path": "değiştirilecek/dosya.py", "content": "<dosyanın yeni TAM içeriği>"}}
  ],
  "commit_message": "kısa, açıklayıcı commit mesajı"
}}

Kurallar:
- Değiştirilmeyecek dosyaları "files" dizisine ekleme.
- Her dosyanın tam ve çalışır içeriğini ver, kesmeden.
- commit_message Türkçe veya İngilizce olabilir, 72 karakteri geçmesin.
- Sadece JSON döndür, başka açıklama ekleme.

## Dosya Ağacı
{tree_text}

## Dosya İçerikleri
{file_section}

## Kullanıcı Komutu
{user_prompt}
"""


def _parse_gemini_response(text: str) -> tuple[list[dict], str]:
    """Gemini yanıtından JSON bloğunu çıkar ve parse et."""
    # Markdown kod bloğu varsa içini al
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    json_str = match.group(1) if match else text.strip()

    # Bazen ```json olmadan düz JSON gelir
    try:
        data = json.loads(json_str)
    except json.JSONDecodeError:
        # İlk { ... } bloğunu yakala
        brace_match = re.search(r"\{.*\}", json_str, re.DOTALL)
        if not brace_match:
            raise ValueError("Gemini geçerli JSON döndürmedi.")
        data = json.loads(brace_match.group())

    return data.get("files", []), data.get("commit_message", "chore: update files")


# ── Ana agent fonksiyonları ────────────────────────────────────────────────────

async def analyze(user_prompt: str) -> AgentResult:
    """
    Kullanıcı komutunu analiz et, değişiklikleri belirle, diff özetini hazırla.
    Henüz commit YAPMAZ.
    """
    result = AgentResult()
    try:
        log.info("Bağlam çekiliyor...")
        tree_text, file_contents = _fetch_context(user_prompt)

        log.info("Gemini'ye istek gönderiliyor...")
        prompt = _build_prompt(user_prompt, tree_text, file_contents)
        response = _model.generate_content(prompt)
        raw = response.text

        files_spec, commit_msg = _parse_gemini_response(raw)
        result.commit_message = commit_msg

        for spec in files_spec:
            path = spec["path"]
            new_content = spec["content"]
            # Mevcut içeriği al (yeni dosyaysa boş string)
            old_content = file_contents.get(path, "")
            result.changes.append(FileChange(path, old_content, new_content))

    except Exception as exc:
        log.exception("analyze() hatası")
        result.error = str(exc)

    return result


async def commit_changes(result: AgentResult) -> AgentResult:
    """
    AgentResult içindeki değişiklikleri GitHub'a commit et.
    Multi-dosya değişikliği için Git Tree API kullanır.
    """
    if result.error or not result.changes:
        result.error = result.error or "Commit edilecek değişiklik yok."
        return result

    try:
        # Mevcut HEAD commit'i al
        ref       = _repo.get_git_ref(f"heads/{GITHUB_BRANCH}")
        head_sha  = ref.object.sha
        base_tree = _repo.get_git_commit(head_sha).tree

        # Her değiştirilmiş dosya için blob oluştur
        blobs = []
        for change in result.changes:
            blob = _repo.create_git_blob(change.new_content, "utf-8")
            blobs.append({
                "path": change.path,
                "mode": "100644",
                "type": "blob",
                "sha": blob.sha,
            })

        # Yeni tree + commit oluştur
        new_tree   = _repo.create_git_tree(blobs, base_tree)
        new_commit = _repo.create_git_commit(
            message=result.commit_message,
            tree=new_tree,
            parents=[_repo.get_git_commit(head_sha)],
        )

        # Branch ref'ini güncelle
        ref.edit(new_commit.sha)
        result.commit_hash = new_commit.sha[:7]
        log.info("Commit başarılı: %s", result.commit_hash)

    except GithubException as exc:
        log.exception("GitHub commit hatası")
        result.error = f"GitHub hatası: {exc.data}"
    except Exception as exc:
        log.exception("commit_changes() hatası")
        result.error = str(exc)

    return result
