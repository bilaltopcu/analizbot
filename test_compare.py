from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9556)
co.headless(True)

page = ChromiumPage(co)
try:
    page.get('http://localhost:3000', timeout=10)
    time.sleep(3)

    # Select Turkey
    page.run_js('document.querySelector("#countryOptionsList .dropdown-option-item").click();')
    time.sleep(1)

    # Select Galatasaray as Home
    page.run_js('''
        var items = document.querySelectorAll("#homeOptionsList .dropdown-option-item");
        for (var it of items) { if (it.dataset.team === "Galatasaray") { it.click(); break; } }
    ''')
    time.sleep(0.5)

    # Select Fenerbahce as Away
    page.run_js('''
        var items = document.querySelectorAll("#awayOptionsList .dropdown-option-item");
        for (var it of items) { if (it.dataset.team === "Fenerbahce" || it.dataset.team === "Fenerbahçe") { it.click(); break; } }
    ''')
    time.sleep(0.5)

    home = page.run_js('return document.getElementById("homeTriggerLabel").textContent;')
    away = page.run_js('return document.getElementById("awayTriggerLabel").textContent;')
    btn_disabled = page.run_js('return document.getElementById("compareBtn").disabled;')
    print(f"Home: {home}")
    print(f"Away: {away}")
    print(f"Compare btn disabled: {btn_disabled}")

    # Click compare
    page.run_js('document.getElementById("compareBtn").click();')
    time.sleep(2)

    # Check results
    results_visible = page.run_js('var r = document.getElementById("resultsSection"); return r ? !r.classList.contains("hidden") : false;')
    print(f"Results visible: {results_visible}")

    # Check for JS errors
    err = page.run_js('''
        try {
            var p = generateTeamProfile("Galatasaray", "TR");
            return "Profile OK, matches: " + p.matches.length;
        } catch(e) {
            return "ERROR: " + e.message;
        }
    ''')
    print(f"generateTeamProfile test: {err}")

    err2 = page.run_js('''
        try {
            var h = generateH2HProfile("Galatasaray", "Fenerbahce");
            return "H2H OK, keys: " + Object.keys(h).join(",");
        } catch(e) {
            return "ERROR: " + e.message;
        }
    ''')
    print(f"generateH2HProfile test: {err2}")

    # Try manually running the compare logic
    err3 = page.run_js('''
        try {
            var hp = generateTeamProfile("Galatasaray", "TR");
            var ap = generateTeamProfile("Fenerbahce", "TR");
            var h2h = generateH2HProfile("Galatasaray", "Fenerbahce");
            
            document.getElementById("bannerHomeName").textContent = hp.teamName;
            document.getElementById("bannerAwayName").textContent = ap.teamName;
            document.getElementById("resultsSection").classList.remove("hidden");
            return "Manual render OK";
        } catch(e) {
            return "ERROR at: " + e.message + " | " + e.stack.split("\\n")[1];
        }
    ''')
    print(f"Manual compare test: {err3}")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    page.quit()
