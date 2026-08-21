import os
import requests

COUNTRY_FLAG_CODES = {
    "TR": "tr",
    "ENG": "gb-eng",
    "ESP": "es",
    "GER": "de",
    "ITA": "it",
    "FRA": "fr",
    "NED": "nl",
    "POR": "pt",
    "BEL": "be",
    "GRE": "gr",
    "SCO": "gb-sct",
    "DNK": "dk",
    "SWE": "se",
    "NOR": "no",
    "POL": "pl",
    "BRA": "br",
    "ARG": "ar",
    "USA": "us",
    "MEX": "mx",
    "ROU": "ro",
    "RUS": "ru",
    "AUT": "at",
    "CHN": "cn",
    "FIN": "fi",
    "IRL": "ie",
    "JPN": "jp",
    "SWZ": "ch"
}

def download_flags():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flags_dir = os.path.join(base_dir, 'flags')
    os.makedirs(flags_dir, exist_ok=True)

    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

    for c_id, code in COUNTRY_FLAG_CODES.items():
        png_path = os.path.join(flags_dir, f"{c_id.lower()}.png")
        url = f"https://flagcdn.com/w80/{code}.png"
        try:
            r = requests.get(url, headers=headers, timeout=5)
            if r.status_code == 200 and len(r.content) > 100:
                with open(png_path, 'wb') as f:
                    f.write(r.content)
                print(f"[OK] Flag downloaded: {c_id} -> flags/{c_id.lower()}.png")
            else:
                print(f"[FAIL] {c_id} (HTTP {r.status_code})")
        except Exception as e:
            print(f"[ERROR] {c_id}: {e}")

if __name__ == '__main__':
    download_flags()
