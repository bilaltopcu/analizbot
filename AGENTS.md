# GOLANALIZ AI - Proje Yönergeleri ve Otomasyon Kuralları

## 📱 OTOMATİK MOBİL VE CANLI GÜNCELLEME PROTOKOLÜ (ZORUNLU)

Kullanıcının kesin talimatı gereği, bu projede kod, arayüz, stil veya veri dosyalarında yapılan **HER YENİLİK VE DÜZELTME SONRASINDA** aşağıdaki adımlar asistan tarafından **OTOMATİK OLARAK** uygulanmalıdır:

1. **Service Worker Sürümünü Artır (`sw.js`):**
   - Yapılan her değişiklikte `sw.js` dosyasının ilk satırındaki `CACHE_NAME` sürüm numarası 1 artırılmalıdır (örn. `golanaliz-v8` -> `golanaliz-v9`).
   - Bu işlem telefon uygulamalarının (PWA) eski önbelleği anında temizleyip yeni sürümü arka planda indirmesini ve sayfayı otomatik yenileyerek güncellemesini sağlar.

2. **Git Commit & Push ile Canlıya Gönder:**
   - Yapılan değişiklikler ve güncellenen `sw.js` sürümü derhal terminalden commit edilip GitHub'a push edilmelidir:
     ```powershell
     git add .
     git commit -m "<yapılan yeniliğin açık ve anlaşılır açıklaması>"
     git push origin master
     ```
   - Bu işlem Vercel / Render canlı dağıtımını (deployment) otomatik olarak tetikler.

3. **Kullanıcıyı Bilgilendir:**
   - Cevapta yapılan yeniliklerin yanı sıra, `sw.js` sürümünün artırıldığı ve GitHub'a push edilerek telefon uygulamasına otomatik olarak gönderildiği açıkça belirtilmelidir.
