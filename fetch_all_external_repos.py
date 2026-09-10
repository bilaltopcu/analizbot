import os
import sys
import json
import csv
import io
import re
import datetime
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MATCHES_FILE = os.path.join(BASE_DIR, 'matches_2026_2027.json')

with open(MATCHES_FILE, 'r', encoding='utf-8') as f:
    existing_matches = json.load(f)

print(f"Current matches in DB: {len(existing_matches)}")

def clean_str(s):
    if not s:
        return ''
    s = s.strip().lower()
    s = re.sub(r'[\s\-_.]+', '', s)
    return s

def make_key(country, home, away, date):
    return f"{clean_str(country)}_{clean_str(home)}_{clean_str(away)}_{date.strip()}"

seen_keys = set()
for m in existing_matches:
    c = m.get('country', '')
    h = m.get('homeTeam', '')
    a = m.get('awayTeam', '')
    d = m.get('date', '')
    seen_keys.add(make_key(c, h, a, d))

headers = {'User-Agent': 'Mozilla/5.0'}

def fetch_url(url):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return resp.read().decode('utf-8', errors='ignore')

new_matches = []

# =========================================================================
# 1. datasets/football-datasets
# =========================================================================
print("\n--- 1. Fetching from datasets/football-datasets ---")
datahub_leagues = [
    ('ENG', 'E0', 'İngiltere Premier League', 'premier-league', ['season-2425.csv', 'season-2526.csv']),
    ('ESP', 'SP1', 'İspanya La Liga', 'la-liga', ['season-2425.csv', 'season-2526.csv']),
    ('GER', 'D1', 'Almanya Bundesliga', 'bundesliga', ['season-2425.csv', 'season-2526.csv']),
    ('ITA', 'I1', 'İtalya Serie A', 'serie-a', ['season-2425.csv', 'season-2526.csv']),
    ('FRA', 'F1', 'Fransa Ligue 1', 'ligue-1', ['season-2425.csv', 'season-2526.csv']),
]

for c_code, l_code, l_name, repo_slug, files in datahub_leagues:
    for s_file in files:
        url = f"https://raw.githubusercontent.com/datasets/football-datasets/main/datasets/{repo_slug}/{s_file}"
        try:
            content = fetch_url(url)
            reader = csv.DictReader(io.StringIO(content))
            added = 0
            season_label = "2025/2026" if "2526" in s_file else "2024/2025"
            for row in reader:
                home = row.get('HomeTeam') or row.get('Home')
                away = row.get('AwayTeam') or row.get('Away')
                date = row.get('Date', '')
                fthg = row.get('FTHG') if row.get('FTHG') is not None else row.get('HG')
                ftag = row.get('FTAG') if row.get('FTAG') is not None else row.get('AG')
                if not home or not away or not date or fthg is None or ftag is None or fthg == '' or ftag == '':
                    continue
                d_clean = date.strip()
                if '-' in d_clean:
                    pts = d_clean.split('-')
                    if len(pts) == 3:
                        d_clean = f"{pts[2]}/{pts[1]}/{pts[0]}"
                
                key = make_key(c_code, home, away, d_clean)
                if key not in seen_keys:
                    seen_keys.add(key)
                    m_dict = {
                        "country": c_code,
                        "league_code": l_code,
                        "league_name": l_name,
                        "season": season_label,
                        "date": d_clean,
                        "time": row.get('Time', ''),
                        "homeTeam": home.strip(),
                        "awayTeam": away.strip(),
                        "referee": (row.get('Referee') or '').strip(),
                        "fthg": int(fthg),
                        "ftag": int(ftag),
                        "ftr": row.get('FTR') or ('H' if int(fthg) > int(ftag) else ('A' if int(fthg) < int(ftag) else 'D')),
                        "hthg": int(row.get('HTHG', 0) or 0) if row.get('HTHG') not in (None, '') else 0,
                        "htag": int(row.get('HTAG', 0) or 0) if row.get('HTAG') not in (None, '') else 0,
                        "htr": row.get('HTR', ''),
                        "hs": int(row.get('HS', 0) or 0) if row.get('HS') not in (None, '') else 0,
                        "as": int(row.get('AS', 0) or 0) if row.get('AS') not in (None, '') else 0,
                        "hst": int(row.get('HST', 0) or 0) if row.get('HST') not in (None, '') else 0,
                        "ast": int(row.get('AST', 0) or 0) if row.get('AST') not in (None, '') else 0,
                        "hc": int(row.get('HC', 0) or 0) if row.get('HC') not in (None, '') else 0,
                        "ac": int(row.get('AC', 0) or 0) if row.get('AC') not in (None, '') else 0,
                        "hy": int(row.get('HY', 0) or 0) if row.get('HY') not in (None, '') else 0,
                        "ay": int(row.get('AY', 0) or 0) if row.get('AY') not in (None, '') else 0,
                        "hr": int(row.get('HR', 0) or 0) if row.get('HR') not in (None, '') else 0,
                        "ar": int(row.get('AR', 0) or 0) if row.get('AR') not in (None, '') else 0
                    }
                    new_matches.append(m_dict)
                    added += 1
            print(f"datasets/football-datasets {repo_slug}/{s_file}: added {added}")
        except Exception as e:
            print(f"Error {repo_slug}/{s_file}: {e}")

# =========================================================================
# 2. footballcsv/cache.footballdata
# =========================================================================
print("\n--- 2. Fetching from footballcsv/cache.footballdata ---")
MONTH_MAP = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
}

def parse_footballcsv_date(d_str):
    d_str = d_str.strip()
    if '-' in d_str:
        pts = d_str.split('-')
        if len(pts) == 3:
            return f"{pts[2]}/{pts[1]}/{pts[0]}"
    pts = d_str.split()
    if len(pts) >= 4:
        m_code = MONTH_MAP.get(pts[1].lower()[:3], '01')
        day = pts[2].zfill(2)
        year = pts[3]
        return f"{day}/{m_code}/{year}"
    return d_str

footballcsv_files = [
    ('2023-24', 'tr.1.csv', 'TR', 'T1', 'Türkiye Süper Lig', '2023/2024'),
    ('2023-24', 'nl.1.csv', 'NED', 'N1', 'Hollanda Eredivisie', '2023/2024'),
    ('2023-24', 'pt.1.csv', 'POR', 'PO1', 'Portekiz Primeira Liga', '2023/2024'),
    ('2023-24', 'be.1.csv', 'BEL', 'B1', 'Belçika Pro League', '2023/2024'),
    ('2023-24', 'gr.1.csv', 'GRE', 'G1', 'Yunanistan Super League', '2023/2024'),
    ('2023-24', 'sco.1.csv', 'SCO', 'SC0', 'İskoçya Premiership', '2023/2024'),
    ('2023-24', 'dk.1.csv', 'DNK', 'DK1', 'Danimarka Superliga', '2023/2024'),
    ('2023-24', 'at.1.csv', 'AUT', 'A1', 'Avusturya Bundesliga', '2023/2024'),
    ('2023-24', 'ch.1.csv', 'SWZ', 'C1', 'İsviçre Super League', '2023/2024'),
    ('2023-24', 'pl.1.csv', 'POL', 'P1', 'Polonya Ekstraklasa', '2023/2024'),
    ('2023-24', 'ro.1.csv', 'ROU', 'RO1', 'Romanya Liga 1', '2023/2024'),
    ('2023-24', 'ru.1.csv', 'RUS', 'RU1', 'Rusya Premier League', '2023/2024'),
    ('2023-24', 'mx.1.csv', 'MEX', 'MEX1', 'Meksika Liga MX', '2023/2024'),
    ('2024', 'ar.1.csv', 'ARG', 'ARG1', 'Arjantin Liga Profesional', '2024'),
    ('2024', 'br.1.csv', 'BRA', 'BRA1', 'Brezilya Serie A', '2024'),
    ('2024', 'cn.1.csv', 'CHN', 'CHN1', 'Çin Süper Ligi', '2024'),
    ('2024', 'fi.1.csv', 'FIN', 'FIN1', 'Finlandiya Veikkausliiga', '2024'),
    ('2024', 'ie.1.csv', 'IRL', 'IRL1', 'İrlanda Premier Division', '2024'),
    ('2024', 'jp.1.csv', 'JPN', 'JPN1', 'Japonya J1 League', '2024'),
    ('2024', 'no.1.csv', 'NOR', 'NOR1', 'Norveç Eliteserien', '2024'),
    ('2024', 'se.1.csv', 'SWE', 'SWE1', 'İsveç Allsvenskan', '2024'),
    ('2024', 'us.1.csv', 'USA', 'USA1', 'ABD Major League Soccer', '2024'),
]

for folder, fname, c_code, l_code, l_name, season_lbl in footballcsv_files:
    url = f"https://raw.githubusercontent.com/footballcsv/cache.footballdata/master/{folder}/{fname}"
    try:
        content = fetch_url(url)
        reader = csv.reader(io.StringIO(content))
        header = next(reader, None)
        if not header:
            continue
        added = 0
        for row in reader:
            if len(row) < 5:
                continue
            raw_date = row[0].strip()
            home = row[1].strip()
            ft_score = row[2].strip()
            ht_score = row[3].strip()
            away = row[4].strip()
            
            if not home or not away or '-' not in ft_score:
                continue
            
            ft_parts = ft_score.split('-')
            try:
                fthg = int(ft_parts[0].strip())
                ftag = int(ft_parts[1].strip())
            except:
                continue

            hthg = 0
            htag = 0
            if '-' in ht_score and '?' not in ht_score:
                ht_parts = ht_score.split('-')
                try:
                    hthg = int(ht_parts[0].strip())
                    htag = int(ht_parts[1].strip())
                except:
                    pass

            d_clean = parse_footballcsv_date(raw_date)
            key = make_key(c_code, home, away, d_clean)
            if key not in seen_keys:
                seen_keys.add(key)
                ftr = 'H' if fthg > ftag else ('A' if ftag > fthg else 'D')
                htr = 'H' if hthg > htag else ('A' if htag > hthg else ('D' if '-' in ht_score else ''))
                m_dict = {
                    "country": c_code,
                    "league_code": l_code,
                    "league_name": l_name,
                    "season": season_lbl,
                    "date": d_clean,
                    "time": "",
                    "homeTeam": home,
                    "awayTeam": away,
                    "referee": "",
                    "fthg": fthg,
                    "ftag": ftag,
                    "ftr": ftr,
                    "hthg": hthg,
                    "htag": htag,
                    "htr": htr,
                    "hs": 0, "as": 0, "hst": 0, "ast": 0,
                    "hc": 0, "ac": 0, "hy": 0, "ay": 0,
                    "hr": 0, "ar": 0
                }
                new_matches.append(m_dict)
                added += 1
        print(f"footballcsv {folder}/{fname} ({c_code}): added {added}")
    except Exception as e:
        print(f"Error {folder}/{fname}: {e}")

# =========================================================================
# 3. jokecamp/FootballData
# =========================================================================
print("\n--- 3. Fetching from jokecamp/FootballData ---")
jokecamp_turkey = [
    ('2015-2016', 'turkish-super-lig-2015-2016.csv', '2015/2016'),
    ('2016-2017', 'turkish-super-lig-2016-2017.csv', '2016/2017'),
]

for folder, fname, season_lbl in jokecamp_turkey:
    url = f"https://raw.githubusercontent.com/jokecamp/FootballData/master/Turkey/SuperLig/{folder}/{fname}"
    try:
        content = fetch_url(url)
        reader = csv.DictReader(io.StringIO(content))
        added = 0
        for row in reader:
            home = row.get('HomeTeam') or row.get('Home')
            away = row.get('AwayTeam') or row.get('Away')
            date = row.get('Date', '')
            fthg = row.get('FTHG') if row.get('FTHG') is not None else row.get('HG')
            ftag = row.get('FTAG') if row.get('FTAG') is not None else row.get('AG')
            if not home or not away or not date or fthg is None or ftag is None or fthg == '' or ftag == '':
                continue
            d_clean = date.strip()
            if '-' in d_clean:
                pts = d_clean.split('-')
                if len(pts) == 3:
                    d_clean = f"{pts[2]}/{pts[1]}/{pts[0]}"
            key = make_key('TR', home, away, d_clean)
            if key not in seen_keys:
                seen_keys.add(key)
                m_dict = {
                    "country": "TR",
                    "league_code": "T1",
                    "league_name": "Türkiye Süper Lig",
                    "season": season_lbl,
                    "date": d_clean,
                    "time": row.get('Time', ''),
                    "homeTeam": home.strip(),
                    "awayTeam": away.strip(),
                    "referee": (row.get('Referee') or '').strip(),
                    "fthg": int(fthg),
                    "ftag": int(ftag),
                    "ftr": row.get('FTR') or ('H' if int(fthg) > int(ftag) else ('A' if int(fthg) < int(ftag) else 'D')),
                    "hthg": int(row.get('HTHG', 0) or 0) if row.get('HTHG') not in (None, '') else 0,
                    "htag": int(row.get('HTAG', 0) or 0) if row.get('HTAG') not in (None, '') else 0,
                    "htr": row.get('HTR', ''),
                    "hs": 0, "as": 0, "hst": 0, "ast": 0,
                    "hc": 0, "ac": 0, "hy": 0, "ay": 0,
                    "hr": 0, "ar": 0
                }
                new_matches.append(m_dict)
                added += 1
        print(f"jokecamp Turkey/{folder}: added {added}")
    except Exception as e:
        print(f"Notice jokecamp Turkey/{folder}: {e}")

print(f"\n==========================================")
print(f"TOTAL NEW MATCHES FOUND: {len(new_matches)}")
print(f"==========================================")

if len(new_matches) > 0:
    all_matches = existing_matches + new_matches
    with open(MATCHES_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_matches, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved {len(all_matches)} matches to {MATCHES_FILE}")
else:
    print("No new matches to save.")
