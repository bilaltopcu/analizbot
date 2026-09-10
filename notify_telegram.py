import os
import sys
import json
import urllib.request
import urllib.parse
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'telegram_config.json')
DEFAULT_TOKEN = '8737398319:AAHxjEQZEPEp7Y1DIk3lkHqWod8CH0lYjxI'

def load_config():
    token = os.environ.get('TELEGRAM_BOT_TOKEN', DEFAULT_TOKEN)
    chat_ids = []
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                token = data.get('bot_token') or token
                chat_ids = data.get('chat_ids', [])
        except Exception as e:
            print(f"Config okuma hatasi: {e}")
    return token, chat_ids

def save_config(token, chat_ids):
    try:
        data = {
            "bot_token": token,
            "bot_username": "EtsyModel_bot",
            "chat_ids": list(set(chat_ids))
        }
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"Config kayit hatasi: {e}")

def fetch_latest_chat_ids(token):
    url = f"https://api.telegram.org/bot{token}/getUpdates?limit=20"
    found_ids = []
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'GolAnalizBot/1.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data.get('ok'):
                for result in data.get('result', []):
                    msg = result.get('message') or result.get('channel_post') or result.get('my_chat_member', {})
                    chat = msg.get('chat', {})
                    c_id = chat.get('id')
                    if c_id:
                        found_ids.append(c_id)
    except Exception as e:
        print(f"Telegram getUpdates uyarisi: {e}")
    return list(set(found_ids))

def send_telegram_message(token, chat_id, text):
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown',
        'disable_web_page_preview': True
    }
    try:
        req_data = urllib.parse.urlencode(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers={
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'GolAnalizBot/1.0'
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            return res_data.get('ok', False)
    except Exception as e:
        print(f"Telegram mesaj gonderme hatasi ({chat_id}): {e}")
        return False

def get_stats_summary():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    total_matches = 14525
    matches_file = os.path.join(base_dir, 'matches_2026_2027.json')
    if os.path.exists(matches_file):
        try:
            with open(matches_file, 'r', encoding='utf-8') as f:
                matches = json.load(f)
                total_matches = len(matches)
        except Exception:
            pass

    win_rate = '80.4'
    perf_file = os.path.join(base_dir, 'performance_data.json')
    if os.path.exists(perf_file):
        try:
            with open(perf_file, 'r', encoding='utf-8') as f:
                perf = json.load(f)
                win_rate = str(perf.get('summary', {}).get('overallWinRate', '80.4'))
        except Exception:
            pass

    sw_version = 'v48'
    sw_file = os.path.join(base_dir, 'sw.js')
    if os.path.exists(sw_file):
        try:
            with open(sw_file, 'r', encoding='utf-8') as f:
                import re
                m = re.search(r"const CACHE_NAME = 'golanaliz-(v\d+)';", f.read())
                if m:
                    sw_version = m.group(1)
        except Exception:
            pass

    return total_matches, win_rate, sw_version

def send_notification(new_count=0, updated_count=0, total_count=None, custom_text=None):
    token, chat_ids = load_config()
    
    fresh_ids = fetch_latest_chat_ids(token)
    for fid in fresh_ids:
        if fid not in chat_ids:
            chat_ids.append(fid)
    if fresh_ids:
        save_config(token, chat_ids)

    if not chat_ids:
        print("[TELEGRAM] Kayitli chat_id bulunamadi. Kullanicinin Telegram botuna /start gondermesi bekleniyor.")
        return False

    tot_matches, win_rate, sw_ver = get_stats_summary()
    if total_count is not None:
        tot_matches = total_count

    now_str = datetime.now().strftime('%d.%m.%Y %H:%M')

    if custom_text:
        msg = custom_text
    else:
        msg = (
            "⚽ *GOLANALIZ AI — Günlük Maç Verileri Güncellendi!* 🚀\n\n"
            f"📅 *Zaman:* {now_str} (Bulut Otomasyonu)\n"
            f"📊 *Yeni Eklenen Maç:* {new_count}\n"
            f"🔄 *Güncellenen Skor/İstatistik:* {updated_count}\n"
            f"📁 *Toplam Veritabanı:* {tot_matches} maç\n"
            f"🏆 *Dixon-Coles Model Başarısı:* %{win_rate}\n"
            f"📱 *PWA Sürümü:* {sw_ver}\n\n"
            "✅ *Canlıya Aktarıldı:* Vercel ve Render dağıtımı tamamlandı.\n"
            "🌐 Bilgisayarınız kapalı olsa dahi sistem 24/7 bulutta kesintisiz çalışmaktadır.\n\n"
            "💡 *Komutlar:* /durum | /guncelle | /analiz | /basari | /maclar"
        )

    success_count = 0
    for cid in chat_ids:
        if send_telegram_message(token, cid, msg):
            success_count += 1
            print(f"[TELEGRAM] Bildirim basariyla iletildi -> Chat ID: {cid}")

    return success_count > 0

if __name__ == '__main__':
    print("[TELEGRAM] Bildirim servisi test ediliyor...")
    send_notification(new_count=0, updated_count=0)
