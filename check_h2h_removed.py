from DrissionPage import ChromiumPage, ChromiumOptions
import time
co = ChromiumOptions()
co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
co.set_local_port(9561)
co.headless(True)
p = ChromiumPage(co)
try:
    p.get('http://localhost:3000', timeout=10)
    time.sleep(2)
    h2h_el = p.run_js('return document.getElementById("h2hSection");')
    print(f"h2hSection in DOM: {h2h_el is not None}")
finally:
    p.quit()
