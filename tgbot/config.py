"""
config.py – Merkezi yapılandırma ve ortam değişkeni yükleme modülü.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── Telegram ──────────────────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN: str = os.environ["TELEGRAM_BOT_TOKEN"]
ALLOWED_CHAT_ID: int    = int(os.environ["ALLOWED_CHAT_ID"])

# ── Gemini AI ─────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.environ["GEMINI_API_KEY"]
GEMINI_MODEL: str   = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

# ── GitHub ────────────────────────────────────────────────────────────────────
GITHUB_TOKEN: str  = os.environ["GITHUB_TOKEN"]
GITHUB_REPO: str   = os.environ["GITHUB_REPO"]   # "kullanici/repo-adi"
GITHUB_BRANCH: str = os.getenv("GITHUB_BRANCH", "master")

# ── Bot davranışı ─────────────────────────────────────────────────────────────
# Onay butonu olmadan doğrudan push mı yapılsın?
AUTO_APPROVE: bool = os.getenv("AUTO_APPROVE", "false").lower() == "true"

# Repoda hangi uzantılar okunabilir? (token tasarrufu için filtre)
READABLE_EXTENSIONS: tuple[str, ...] = (
    ".py", ".js", ".ts", ".html", ".css", ".json",
    ".md", ".txt", ".yaml", ".yml", ".sh", ".env.example",
)

# Ağaç oluştururken atlanacak klasörler
SKIP_DIRS: set[str] = {
    ".git", "node_modules", "__pycache__", ".vercel",
    "venv", ".venv", "dist", "build", "flags", "logos",
    "icons",
}

# Tek seferde Gemini'ye gönderilecek maksimum içerik (karakter)
MAX_CONTEXT_CHARS: int = int(os.getenv("MAX_CONTEXT_CHARS", "120000"))
