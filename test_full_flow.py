from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9558)
co.headless(True)

page = ChromiumPage(co)
try:
    page.get('http://localhost:3000', timeout=10)
    time.sleep(2)

    # 1. Select Turkey
    page.run_js('document.querySelector("#countryOptionsList .dropdown-option-item").click();')
    time.sleep(0.5)

    # 2. Select Galatasaray vs Fenerbahce
    page.run_js('''
        var items = document.querySelectorAll("#homeOptionsList .dropdown-option-item");
        for (var it of items) { if (it.dataset.team === "Galatasaray") { it.click(); break; } }
        var awayItems = document.querySelectorAll("#awayOptionsList .dropdown-option-item");
        for (var it of awayItems) { if (it.dataset.team === "Fenerbahçe" || it.dataset.team === "Fenerbahce") { it.click(); break; } }
    ''')
    time.sleep(0.5)

    # 3. Click Compare
    page.run_js('document.getElementById("compareBtn").click();')
    time.sleep(1)

    # 4. Click AI Predict
    page.run_js('document.getElementById("aiPredictBtn").click();')
    time.sleep(3)

    # 5. Check AI result badge & explanation
    badge_text = page.run_js('return document.getElementById("aiModelBadge") ? document.getElementById("aiModelBadge").textContent.trim() : "NO BADGE";')
    title_text = page.run_js('return document.getElementById("aiExplanationTitle") ? document.getElementById("aiExplanationTitle").textContent.trim() : "NO TITLE";')
    exp_text = page.run_js('return document.getElementById("aiExplanationText") ? document.getElementById("aiExplanationText").textContent.trim() : "NO TEXT";')
    
    print(f"Badge: {badge_text}")
    print(f"Title: {title_text}")
    print(f"Explanation: {exp_text[:120]}...")

    # 6. Check Poisson table
    poisson_rows = page.run_js('return document.querySelectorAll("#poissonMatrixTable tbody tr").length;')
    print(f"Poisson rows: {poisson_rows}")

finally:
    page.quit()
