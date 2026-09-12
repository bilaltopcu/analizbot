import re
import os

sw_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sw.js')

with open(sw_path, 'r', encoding='utf-8') as f:
    content = f.read()

def bump_ver(match):
    curr = int(match.group(1))
    new_ver = curr + 1
    print(f"Service Worker sürümü güncelleniyor: v{curr} -> v{new_ver}")
    return f"const CACHE_NAME = 'golanaliz-v{new_ver}';"

updated, count = re.subn(r"const CACHE_NAME = 'golanaliz-v(\d+)';", bump_ver, content, count=1)

if count > 0:
    with open(sw_path, 'w', encoding='utf-8') as f:
        f.write(updated)
    print("Service Worker (sw.js) sürümü başarıyla artırıldı.")
else:
    print("UYARI: CACHE_NAME deseni bulunamadı, sürüm artırılamadı.")
