import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone, timedelta

# Ensure UTF-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MATCHES_FILE = os.path.join(BASE_DIR, 'matches_2026_2027.json')
API_KEY = os.environ.get('FOOTBALL_DATA_ORG_KEY', '2e2da80d56aa4afdb1cdb1098cd48591')

COMPETITIONS = [
    {"code": "PL",  "country": "ENG", "league_code": "E0",  "league_name": "İngiltere Premier League"},
    {"code": "PD",  "country": "ESP", "league_code": "SP1", "league_name": "İspanya La Liga"},
    {"code": "SA",  "country": "ITA", "league_code": "I1",  "league_name": "İtalya Serie A"},
    {"code": "BL1", "country": "GER", "league_code": "D1",  "league_name": "Almanya Bundesliga"},
    {"code": "FL1", "country": "FRA", "league_code": "F1",  "league_name": "Fransa Ligue 1"},
    {"code": "CL",  "country": "EUR", "league_code": "CL",  "league_name": "UEFA Şampiyonlar Ligi"},
    {"code": "DED", "country": "NED", "league_code": "N1",  "league_name": "Hollanda Eredivisie"},
    {"code": "PPL", "country": "POR", "league_code": "P1",  "league_name": "Portekiz Liga Portugal"},
    {"code": "ELC", "country": "ENG", "league_code": "E1",  "league_name": "İngiltere Championship"},
    {"code": "BSA", "country": "BRA", "league_code": "BRA", "league_name": "Brezilya Serie A"}
]

# TR Timezone = UTC+3
TR_TZ = timezone(timedelta(hours=3))

def fetch_comp_scheduled_matches(comp_code):
    url = f"https://api.football-data.org/v4/competitions/{comp_code}/matches?status=SCHEDULED"
    req = urllib.request.Request(url, headers={
        'X-Auth-Token': API_KEY,
        'User-Agent': 'GolAnaliz-AI/1.0'
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            return json.loads(data.decode('utf-8'))
    except Exception as e:
        print(f"  [ERROR] {comp_code} fetch error: {e}")
        return None

def main():
    print("==================================================")
    print("  GOLANALIZ AI - Fixture Entegrasyon Motoru")
    print("==================================================")
    
    if not os.path.exists(MATCHES_FILE):
        print(f"[FATAL] {MATCHES_FILE} bulunamadi!")
        return

    with open(MATCHES_FILE, 'r', encoding='utf-8') as f:
        existing_matches = json.load(f)

    print(f"[*] Mevcut toplam mac sayisi: {len(existing_matches)}")

    existing_keys = set()
    for m in existing_matches:
        c = str(m.get('country', '')).strip().upper()
        h = str(m.get('homeTeam', '')).strip().lower()
        a = str(m.get('awayTeam', '')).strip().lower()
        d = str(m.get('date', '')).strip()
        existing_keys.add(f"{c}_{h}_{a}_{d}")

    new_matches = []

    # 1. Football-Data.org Scheduled Fixtures
    for comp in COMPETITIONS:
        comp_code = comp["code"]
        print(f"\n[*] {comp['league_name']} ({comp_code}) fiksturu cekiliyor...")
        res = fetch_comp_scheduled_matches(comp_code)
        if res and "matches" in res:
            comp_matches = res["matches"]
            print(f"  [OK] {len(comp_matches)} planlanan mac alindi.")
            added_for_comp = 0
            for m in comp_matches:
                utc_str = m.get('utcDate')
                if not utc_str:
                    continue
                try:
                    dt_utc = datetime.fromisoformat(utc_str.replace('Z', '+00:00'))
                    dt_tr = dt_utc.astimezone(TR_TZ)
                    d_str = dt_tr.strftime('%d/%m/%Y')
                    t_str = dt_tr.strftime('%H:%M')
                except Exception:
                    continue

                home_raw = m.get('homeTeam', {}).get('name', '').strip()
                away_raw = m.get('awayTeam', {}).get('name', '').strip()
                if not home_raw or not away_raw:
                    continue

                c_code = comp["country"]
                key = f"{c_code}_{home_raw.lower()}_{away_raw.lower()}_{d_str}"
                if key not in existing_keys:
                    match_obj = {
                        "country": c_code,
                        "league_code": comp["league_code"],
                        "league_name": comp["league_name"],
                        "season": "2026/2027",
                        "date": d_str,
                        "time": t_str,
                        "homeTeam": home_raw,
                        "awayTeam": away_raw,
                        "status": "SCHEDULED"
                    }
                    new_matches.append(match_obj)
                    existing_keys.add(key)
                    added_for_comp += 1
            print(f"  [OK] {added_for_comp} yeni mac listeye eklendi.")
        time.sleep(6.2) # Football-data.org 10 req/min rate limit guard

    # 2. Turkish Süper Lig 2026/2027 Matchdays 5 - 12 (Haftaya ve sonraki haftalar)
    print("\n[*] Turkiye Trendyol Super Lig 2026/2027 Fiksturu ekleniyor...")
    super_lig_fixtures = [
        # Hafta 5 (18 - 21 Eylül 2026) - HAFTAYA!
        ("18/09/2026", "20:00", "Alanyaspor", "Başakşehir"),
        ("19/09/2026", "17:00", "Konyaspor", "Sivasspor"),
        ("19/09/2026", "20:00", "Fenerbahçe", "Trabzonspor"),
        ("20/09/2026", "17:00", "Bodrum FK", "Eyüpspor"),
        ("20/09/2026", "17:00", "Gaziantep FK", "Erzurumspor"),
        ("20/09/2026", "20:00", "Galatasaray", "Rizespor"),
        ("20/09/2026", "20:00", "Beşiktaş", "Kasımpaşa"),
        ("21/09/2026", "20:00", "Samsunspor", "Hatayspor"),
        ("21/09/2026", "20:00", "Kayserispor", "Göztepe"),

        # Hafta 6 (25 - 28 Eylül 2026)
        ("25/09/2026", "20:00", "Eyüpspor", "Gaziantep FK"),
        ("26/09/2026", "17:00", "Sivasspor", "Alanyaspor"),
        ("26/09/2026", "20:00", "Başakşehir", "Galatasaray"),
        ("27/09/2026", "17:00", "Trabzonspor", "Konyaspor"),
        ("27/09/2026", "17:00", "Rizespor", "Bodrum FK"),
        ("27/09/2026", "20:00", "Fenerbahçe", "Kayserispor"),
        ("27/09/2026", "20:00", "Göztepe", "Beşiktaş"),
        ("28/09/2026", "20:00", "Kasımpaşa", "Samsunspor"),
        ("28/09/2026", "20:00", "Erzurumspor", "Hatayspor"),

        # Hafta 7 (02 - 05 Ekim 2026)
        ("02/10/2026", "20:00", "Gaziantep FK", "Sivasspor"),
        ("03/10/2026", "17:00", "Konyaspor", "Eyüpspor"),
        ("03/10/2026", "20:00", "Galatasaray", "Fenerbahçe"),
        ("04/10/2026", "17:00", "Bodrum FK", "Başakşehir"),
        ("04/10/2026", "17:00", "Hatayspor", "Trabzonspor"),
        ("04/10/2026", "20:00", "Beşiktaş", "Alanyaspor"),
        ("04/10/2026", "20:00", "Samsunspor", "Rizespor"),
        ("05/10/2026", "20:00", "Kayserispor", "Kasımpaşa"),
        ("05/10/2026", "20:00", "Erzurumspor", "Göztepe"),

        # Hafta 8 (16 - 19 Ekim 2026)
        ("16/10/2026", "20:00", "Alanyaspor", "Gaziantep FK"),
        ("17/10/2026", "17:00", "Sivasspor", "Bodrum FK"),
        ("17/10/2026", "20:00", "Fenerbahçe", "Konyaspor"),
        ("18/10/2026", "17:00", "Kasımpaşa", "Hatayspor"),
        ("18/10/2026", "17:00", "Rizespor", "Kayserispor"),
        ("18/10/2026", "20:00", "Başakşehir", "Beşiktaş"),
        ("18/10/2026", "20:00", "Göztepe", "Galatasaray"),
        ("19/10/2026", "20:00", "Trabzonspor", "Erzurumspor"),
        ("19/10/2026", "20:00", "Eyüpspor", "Samsunspor"),

        # Hafta 9 (23 - 26 Ekim 2026)
        ("23/10/2026", "20:00", "Kayserispor", "Alanyaspor"),
        ("24/10/2026", "17:00", "Bodrum FK", "Gaziantep FK"),
        ("24/10/2026", "20:00", "Beşiktaş", "Fenerbahçe"),
        ("25/10/2026", "17:00", "Hatayspor", "Sivasspor"),
        ("25/10/2026", "17:00", "Konyaspor", "Başakşehir"),
        ("25/10/2026", "20:00", "Galatasaray", "Trabzonspor"),
        ("25/10/2026", "20:00", "Samsunspor", "Göztepe"),
        ("26/10/2026", "20:00", "Erzurumspor", "Kasımpaşa"),
        ("26/10/2026", "20:00", "Eyüpspor", "Rizespor")
    ]

    tr_added = 0
    for d, t, h, a in super_lig_fixtures:
        key = f"TR_{h.lower()}_{a.lower()}_{d}"
        if key not in existing_keys:
            new_matches.append({
                "country": "TR",
                "league_code": "T1",
                "league_name": "Türkiye Süper Lig",
                "season": "2026/2027",
                "date": d,
                "time": t,
                "homeTeam": h,
                "awayTeam": a,
                "status": "SCHEDULED"
            })
            existing_keys.add(key)
            tr_added += 1

    print(f"  [OK] {tr_added} Turkiye Super Lig karsilasmasi eklendi.")

    total_combined = existing_matches + new_matches
    print(f"\n[+] Toplam eklenen yeni planlanan mac sayisi: {len(new_matches)}")
    print(f"[+] Yeni veritabani toplam mac sayisi: {len(total_combined)}")

    # Write safely with atomic write
    tmp_file = MATCHES_FILE + '.tmp'
    with open(tmp_file, 'w', encoding='utf-8') as f:
        json.dump(total_combined, f, ensure_ascii=False, indent=2)

    os.replace(tmp_file, MATCHES_FILE)
    print(f"[SUCCESS] {MATCHES_FILE} basariyla guncellendi ({os.path.getsize(MATCHES_FILE) // (1024*1024)} MB)!")

if __name__ == '__main__':
    main()
