"""
bot.py – Telegram bot ana döngüsü.

Akış:
  /start        → karşılama mesajı
  Herhangi metin → agent.analyze() → diff önizleme + Onayla/Reddet butonu
  Onayla CB     → agent.commit_changes() → commit hash + özet
  Reddet CB     → iptal mesajı
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from typing import cast

from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Update,
)
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

# Paket içi import – tgbot/ klasöründen çalışıldığında düz import yeterli
try:
    from config import ALLOWED_CHAT_ID, AUTO_APPROVE, TELEGRAM_BOT_TOKEN
    from agent import AgentResult, analyze, commit_changes
except ImportError:
    sys.path.insert(0, os.path.dirname(__file__))
    from config import ALLOWED_CHAT_ID, AUTO_APPROVE, TELEGRAM_BOT_TOKEN
    from agent import AgentResult, analyze, commit_changes

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()],
)
log = logging.getLogger(__name__)

# ── Geçici bellek: callback için sonuçları sakla ───────────────────────────────
# { message_id: AgentResult }
_pending: dict[int, AgentResult] = {}

# ── Güvenlik dekoratörü ────────────────────────────────────────────────────────

def _only_allowed(func):
    """Sadece ALLOWED_CHAT_ID'den gelen istekleri işle."""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = (
            update.effective_chat.id
            if update.effective_chat
            else update.callback_query.message.chat_id  # type: ignore[union-attr]
        )
        if chat_id != ALLOWED_CHAT_ID:
            log.warning("Yetkisiz erişim denemesi: chat_id=%s", chat_id)
            return
        return await func(update, context)
    return wrapper


# ── Handler'lar ────────────────────────────────────────────────────────────────

@_only_allowed
async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(  # type: ignore[union-attr]
        "👋 *GolAnaliz AI Bot* aktif!\n\n"
        "Bana doğal dilde bir görev yaz; deponuzu analiz edip kodu güncelleyeyim.\n\n"
        "_Örnek:_ `app.js dosyasındaki /api/predict endpoint'ine rate‑limit ekle`",
        parse_mode="Markdown",
    )


@_only_allowed
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message   = update.message  # type: ignore[union-attr]
    user_text = message.text or ""

    if not user_text.strip():
        return

    # Kullanıcıya bekleme bildirimi
    wait_msg = await message.reply_text(
        "⏳ Depo analiz ediliyor, lütfen bekleyin…",
    )

    result = await analyze(user_text)

    # Hata varsa bildir
    if result.error:
        await wait_msg.edit_text(f"❌ Hata oluştu:\n```\n{result.error}\n```", parse_mode="Markdown")
        return

    if not result.changes:
        await wait_msg.edit_text("⚠️ Gemini herhangi bir değişiklik önermedi.")
        return

    # Diff önizleme metnini oluştur
    diff_preview = result.diff_text
    # Telegram mesaj limiti 4096 karakter
    if len(diff_preview) > 3800:
        diff_preview = diff_preview[:3800] + "\n…(kısaltıldı)"

    changed_files = ", ".join(f"`{c.path}`" for c in result.changes)
    preview_text = (
        f"🔍 *Önerilen değişiklikler*\n"
        f"Dosyalar: {changed_files}\n"
        f"Commit: `{result.commit_message}`\n\n"
        f"```diff\n{diff_preview}\n```"
    )

    if AUTO_APPROVE:
        # Onay beklemeden commit et
        await wait_msg.edit_text(preview_text + "\n\n⚙️ Otomatik onay aktif, commit yapılıyor…", parse_mode="Markdown")
        result = await commit_changes(result)
        if result.error:
            await message.reply_text(f"❌ Commit hatası:\n`{result.error}`", parse_mode="Markdown")
        else:
            await message.reply_text(
                f"✅ Commit başarılı!\n"
                f"Hash: `{result.commit_hash}`\n"
                f"Mesaj: {result.commit_message}",
                parse_mode="Markdown",
            )
        return

    # Onay butonları
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("✅ Onayla", callback_data="approve"),
            InlineKeyboardButton("❌ Reddet", callback_data="reject"),
        ]
    ])

    preview_msg = await wait_msg.edit_text(
        preview_text,
        parse_mode="Markdown",
        reply_markup=keyboard,
    )

    # Sonucu pending sözlüğünde sakla
    _pending[preview_msg.message_id] = result


@_only_allowed
async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()  # type: ignore[union-attr]

    msg_id = query.message.message_id  # type: ignore[union-attr]
    result = _pending.pop(msg_id, None)

    if result is None:
        await query.edit_message_text("⚠️ Bu istek artık geçerli değil veya zaman aşımına uğradı.")  # type: ignore[union-attr]
        return

    if query.data == "reject":  # type: ignore[union-attr]
        await query.edit_message_text("🚫 Değişiklik iptal edildi.")  # type: ignore[union-attr]
        return

    # Onayla → commit
    await query.edit_message_text("⚙️ Commit yapılıyor…")  # type: ignore[union-attr]
    result = await commit_changes(result)

    if result.error:
        await query.edit_message_text(  # type: ignore[union-attr]
            f"❌ Commit hatası:\n`{result.error}`",
            parse_mode="Markdown",
        )
    else:
        changed_files = "\n".join(f"  • `{c.path}`" for c in result.changes)
        await query.edit_message_text(  # type: ignore[union-attr]
            f"✅ *Commit başarılı!*\n\n"
            f"🔖 Hash: `{result.commit_hash}`\n"
            f"📝 Mesaj: {result.commit_message}\n\n"
            f"📂 Güncellenen dosyalar:\n{changed_files}",
            parse_mode="Markdown",
        )


# ── Ana giriş noktası ──────────────────────────────────────────────────────────

def main() -> None:
    app = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .build()
    )

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CallbackQueryHandler(handle_callback))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    log.info("Bot başlatılıyor… (polling)")
    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
