# 🤖 Telegram AI Code Editor Bot – Kurulum & Deploy Rehberi

Telegram'dan doğal dil komutlarıyla GitHub reponuzu güncelleyen otonom Python botu.

---

## 📁 Dosya Yapısı

```
tgbot/
├── bot.py            ← Telegram handler'ları, ana döngü
├── agent.py          ← Gemini + GitHub AI katmanı
├── config.py         ← Ortam değişkenleri
├── requirements.txt  ← Bağımlılıklar
├── render.yaml       ← Render.com deploy yapılandırması
├── .env.example      ← Ortam değişkeni şablonu
└── .gitignore
```

---

## ⚙️ Yerel Kurulum

### 1. API Anahtarlarını Hazırla

| Servis | Nereden Alınır |
|--------|---------------|
| `TELEGRAM_BOT_TOKEN` | @BotFather → /newbot |
| `ALLOWED_CHAT_ID` | @userinfobot → /start |
| `GEMINI_API_KEY` | aistudio.google.com → Get API Key |
| `GITHUB_TOKEN` | GitHub → Settings → Developer Settings → Fine-grained PAT → Contents: Read & Write |

### 2. Ortam Değişkenlerini Ayarla

```powershell
cd tgbot
copy .env.example .env
# .env dosyasını bir editörde aç ve değerleri doldur
```

### 3. Bağımlılıkları Yükle

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 4. Botu Başlat

```powershell
python bot.py
```

---

## 🚀 7/24 Bulut Deploy – Render.com (Ücretsiz Worker)

### Adım 1 – tgbot/ klasörünü ayrı bir GitHub reposuna push et

```powershell
cd tgbot
git init
git add .
git commit -m "feat: telegram ai bot initial commit"
git remote add origin https://github.com/KULLANICI/tgai-bot.git
git push -u origin master
```

> ⚠️ .env dosyasını kesinlikle push etme — .gitignore zaten engeller.

### Adım 2 – Render'a Bağlan

1. render.com → New → Background Worker
2. GitHub reposunu seç (tgai-bot)
3. Render otomatik render.yaml'ı algılar.
4. Environment Variables sekmesine şu değerleri gir:

| Key | Değer |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | BotFather token |
| `ALLOWED_CHAT_ID` | Senin chat ID'n |
| `GEMINI_API_KEY` | Google AI Studio anahtarı |
| `GITHUB_TOKEN` | GitHub Fine-grained PAT |
| `GITHUB_REPO` | bilaltopcu/analizbot |
| `GITHUB_BRANCH` | master |
| `AUTO_APPROVE` | false |

5. Create Background Worker → Deploy başlar (~2 dakika).

### Adım 3 – Doğrula

Render loglarında şunu gör:
```
Bot başlatılıyor… (polling)
```

---

## 💬 Kullanım Örnekleri

```
app.js içindeki /api/predict endpoint'ine dakikada 10 istek rate-limit ekle
```
```
fetch_latest_stats.py dosyasına hata loglama ve retry mekanizması koy
```
```
server.py'daki tüm print() ifadelerini logging.info() ile değiştir
```

Bot yanıt olarak:
1. 🔍 Diff önizlemesi + ✅ Onayla / ❌ Reddet butonları
2. Onaylarsan → ✅ Commit başarılı! Hash: abc1234

---

## 🔒 Güvenlik Notları

- `ALLOWED_CHAT_ID` sayesinde yalnızca sen komut verebilirsin.
- GitHub PAT'ı yalnızca hedef repoya kısıtla (Fine-grained PAT).
- `AUTO_APPROVE=false` olarak bırak — her değişikliği onaylamak seni korur.

---

## 🐛 Sorun Giderme

| Belirti | Çözüm |
|---------|-------|
| `KeyError: TELEGRAM_BOT_TOKEN` | .env dosyasındaki değeri kontrol et |
| `401 Unauthorized` (GitHub) | PAT'ın Contents: write yetkisi var mı? |
| Gemini JSON parse hatası | GEMINI_MODEL değişkeniyle farklı model dene |
| Render'da bot duruyorsa | Render loglarını kontrol et |
