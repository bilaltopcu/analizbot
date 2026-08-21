from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9555)
co.headless(True)

page = ChromiumPage(co)
try:
    page.get('http://localhost:3000', timeout=10)
    time.sleep(3)
    
    print("=== PAGE TITLE ===")
    print(page.title)
    
    print("\n=== JS ERRORS ===")
    # Check if key globals exist
    checks = [
        ('FOOTBALL_DATA', 'typeof FOOTBALL_DATA !== "undefined"'),
        ('ADVANCED_TEAM_STATS', 'typeof ADVANCED_TEAM_STATS !== "undefined"'),
        ('LOCAL_LOGO_MAP', 'typeof LOCAL_LOGO_MAP !== "undefined"'),
        ('countries count', 'typeof FOOTBALL_DATA !== "undefined" ? FOOTBALL_DATA.countries.length : 0'),
    ]
    for label, expr in checks:
        val = page.run_js(f'return {expr};')
        print(f"  {label}: {val}")

    print("\n=== COUNTRY DROPDOWN ===")
    trigger = page.ele('#countryDropdownTrigger')
    print(f"  Trigger exists: {trigger is not None}")
    
    options_el = page.ele('#countryOptionsList')
    if options_el:
        children = options_el.children()
        print(f"  Country options count: {len(children)}")
    else:
        print("  Country options list NOT FOUND")

    # Try clicking the country trigger
    if trigger:
        trigger.click()
        time.sleep(0.5)
        menu = page.ele('#countryDropdownMenu')
        if menu:
            hidden = page.run_js('return document.getElementById("countryDropdownMenu").classList.contains("hidden");')
            print(f"  Menu hidden after click: {hidden}")

    # Try clicking first country
    first_country = page.run_js('''
        var items = document.querySelectorAll("#countryOptionsList .dropdown-option-item");
        if (items.length > 0) {
            items[0].click();
            return items[0].textContent.trim();
        }
        return "NO ITEMS";
    ''')
    print(f"  Clicked first country: {first_country}")
    time.sleep(1)

    # Check teams wrapper visibility
    teams_visible = page.run_js('var w = document.getElementById("teamsSelectionWrapper"); return w ? !w.classList.contains("hidden") : false;')
    print(f"  Teams wrapper visible: {teams_visible}")

    # Check home options
    home_count = page.run_js('return document.querySelectorAll("#homeOptionsList .dropdown-option-item").length;')
    print(f"  Home team options: {home_count}")

    print("\n=== CONSOLE ERRORS ===")
    # Check for JS errors via performance entries or error listeners
    errors = page.run_js('''
        var errs = [];
        try {
            var entries = performance.getEntriesByType("resource");
            for (var e of entries) {
                if (e.transferSize === 0 && e.decodedBodySize === 0 && !e.name.includes("favicon")) {
                    errs.push("FAILED: " + e.name);
                }
            }
        } catch(ex) {}
        return errs.slice(0, 10);
    ''')
    for e in errors:
        print(f"  {e}")
    if not errors:
        print("  No failed resources detected")

except Exception as e:
    print(f"ERROR: {e}")
finally:
    page.quit()
