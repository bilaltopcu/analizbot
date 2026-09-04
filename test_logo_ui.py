from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9557)
co.headless(True)

page = ChromiumPage(co)
try:
    page.get('http://localhost:3000', timeout=10)
    time.sleep(2)

    flag_src = page.run_js('var img = document.querySelector("#countryOptionsList img"); return img ? {src: img.src, naturalWidth: img.naturalWidth} : null;')
    print(f"Flag in dropdown: {flag_src}")

    page.run_js('document.querySelector("#countryOptionsList .dropdown-option-item").click();')
    time.sleep(0.5)

    home_logos = page.run_js('''
        var imgs = document.querySelectorAll("#homeOptionsList .dropdown-option-item img");
        var res = [];
        for (var i = 0; i < Math.min(imgs.length, 10); i++) {
            res.push({
                team: imgs[i].parentElement.dataset.team,
                src: imgs[i].src,
                naturalWidth: imgs[i].naturalWidth,
                complete: imgs[i].complete
            });
        }
        return res;
    ''')
    print("Home team logos in dropdown:")
    for item in home_logos:
        print(f"  {item}")

    page.run_js('''
        var items = document.querySelectorAll("#homeOptionsList .dropdown-option-item");
        for (var it of items) { if (it.dataset.team === "Galatasaray") { it.click(); break; } }
        var awayItems = document.querySelectorAll("#awayOptionsList .dropdown-option-item");
        for (var it of awayItems) { if (it.dataset.team === "Fenerbahçe" || it.dataset.team === "Fenerbahce") { it.click(); break; } }
        document.getElementById("compareBtn").click();
    ''')
    time.sleep(1)

    banner_home = page.run_js('var img = document.getElementById("bannerHomeLogo"); return {src: img.src, naturalWidth: img.naturalWidth};')
    banner_away = page.run_js('var img = document.getElementById("bannerAwayLogo"); return {src: img.src, naturalWidth: img.naturalWidth};')
    print(f"Banner Home Logo: {banner_home}")
    print(f"Banner Away Logo: {banner_away}")

finally:
    page.quit()
