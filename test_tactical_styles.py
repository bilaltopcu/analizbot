from DrissionPage import ChromiumPage, ChromiumOptions
import time

co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9562)
co.headless(True)

p = ChromiumPage(co)
try:
    p.get('http://localhost:3000', timeout=10)
    time.sleep(2)

    # Country Turkey
    p.run_js('document.querySelector("#countryOptionsList .dropdown-option-item").click();')
    time.sleep(0.5)

    # Galatasaray vs Fenerbahce
    p.run_js('document.querySelectorAll("#homeOptionsList .dropdown-option-item")[0].click();')
    p.run_js('document.querySelectorAll("#awayOptionsList .dropdown-option-item")[1].click();')
    p.run_js('document.getElementById("compareBtn").click();')
    p.run_js('document.getElementById("aiPredictBtn").click();')
    time.sleep(3)

    info = p.run_js('''
        var tacCard = document.querySelector(".tactical-card");
        var riskCard = document.querySelector(".risk-card");
        var tacText = document.getElementById("geminiTacticalText");
        var riskText = document.getElementById("geminiRiskText");
        
        var csTac = tacText ? window.getComputedStyle(tacText) : null;
        var csRisk = riskText ? window.getComputedStyle(riskText) : null;
        var csTacCard = tacCard ? window.getComputedStyle(tacCard) : null;
        var csRiskCard = riskCard ? window.getComputedStyle(riskCard) : null;

        return {
            tacticalText: tacText ? tacText.textContent : "YOK",
            riskText: riskText ? riskText.textContent : "YOK",
            tacTextColor: csTac ? csTac.color : "YOK",
            riskTextColor: csRisk ? csRisk.color : "YOK",
            tacCardBg: csTacCard ? csTacCard.backgroundImage || csTacCard.backgroundColor : "YOK",
            riskCardBg: csRiskCard ? csRiskCard.backgroundImage || csRiskCard.backgroundColor : "YOK"
        };
    ''')
    print("Tactical Text:")
    print(" ", info['tacticalText'][:100], "...")
    print("Risk Text:")
    print(" ", info['riskText'][:100], "...")
    print(f"Tactical Text Color: {info['tacTextColor']}")
    print(f"Risk Text Color: {info['riskTextColor']}")
    print(f"Tactical Card BG: {info['tacCardBg'][:60]}...")
    print(f"Risk Card BG: {info['riskCardBg'][:60]}...")
finally:
    p.quit()
