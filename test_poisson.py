from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9560)
co.headless(True)

p = ChromiumPage(co)
try:
    p.get('http://localhost:3000', timeout=10)
    time.sleep(2)
    p.run_js('document.querySelector("#countryOptionsList .dropdown-option-item").click();')
    time.sleep(0.5)
    p.run_js('document.querySelectorAll("#homeOptionsList .dropdown-option-item")[0].click();')
    p.run_js('document.querySelectorAll("#awayOptionsList .dropdown-option-item")[1].click();')
    p.run_js('document.getElementById("compareBtn").click();')
    p.run_js('document.getElementById("aiPredictBtn").click();')
    time.sleep(1)
    cards = p.run_js('return document.querySelectorAll("#poissonGrid .poisson-card").length;')
    pills = p.run_js('return document.querySelectorAll("#poissonLikelyRow .poisson-likely-pill").length;')
    print(f"Poisson cards: {cards}")
    print(f"Poisson pills: {pills}")
finally:
    p.quit()
