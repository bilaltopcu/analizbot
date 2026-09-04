import os
import json
import csv
import io
import re
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r'c:\Users\Zelal Topçu\OneDrive\Masaüstü\analizbot'
brain_dir = r'C:\Users\Zelal Topçu\.gemini\antigravity\brain\f3ce34b0-7bef-4acc-bebc-fda49da5c4f8\.system_generated\steps'

TEAM_CANONICAL = {
    'Besiktas': 'Beşiktaş', 'Buyuksehyr': 'Başakşehir', 'Basaksehir': 'Başakşehir',
    'Eyupspor': 'Eyüpspor', 'Fenerbahce': 'Fenerbahçe', 'Gaziantep': 'Gaziantep FK',
    'Goztep': 'Göztepe', 'Goztepe': 'Göztepe', 'Kasimpasa': 'Kasımpaşa',
    'Genclerbirligi': 'Gençlerbirliği', 'Karagumruk': 'Fatih Karagümrük',
    'Caykur Rizespor': 'Rizespor',
    'Man City': 'Manchester City', 'Man United': 'Manchester United',
    'Nott\'m Forest': 'Nottingham Forest',
    'Ath Bilbao': 'Athletic Bilbao', 'Ath Madrid': 'Atletico Madrid',
    'Betis': 'Real Betis', 'Celta': 'Celta Vigo', 'Espanol': 'Espanyol',
    'Sociedad': 'Real Sociedad', 'Vallecano': 'Rayo Vallecano',
    'Ein Frankfurt': 'Eintracht Frankfurt', 'Dortmund': 'Borussia Dortmund',
    'Leverkusen': 'Bayer Leverkusen', 'M\'gladbach': 'Borussia M\'gladbach',
    'Bochum': 'VfL Bochum', 'Hoffenheim': 'TSG Hoffenheim',
    'St Pauli': 'St. Pauli', 'Stuttgart': 'VfB Stuttgart',
    'Milan': 'AC Milan', 'Roma': 'AS Roma',
    'St Etienne': 'Saint-Etienne',
}

def safe_int(val, default=0):
    if val is None: return default
    s = str(val).strip()
    if not s: return default
    try: return int(float(s))
    except: return default

def safe_float(val, default=None):
    if val is None: return default
    s = str(val).strip()
    if not s: return default
    try:
        f = float(s)
        return round(f, 2) if f > 0 else default
    except: return default

def get_match_key(m):
    return m['country'] + '_' + m['homeTeam'].lower() + '_' + m['awayTeam'].lower() + '_' + m.get('date', '')

def parse_main_csv(lines, country_code, league_code, league_name, season_label='2026/2027'):
    csv_lines = []
    start = False
    for l in lines:
        if ('Div,' in l or 'HomeTeam,' in l or 'Date,' in l) and not start:
            start = True
        if start:
            csv_lines.append(l)
    if not csv_lines:
        return []
    
    content = ''.join(csv_lines).strip()
    reader = csv.DictReader(io.StringIO(content))
    matches = []
    for row in reader:
        home = (row.get('HomeTeam') or row.get('Home', '')).strip()
        away = (row.get('AwayTeam') or row.get('Away', '')).strip()
        if not home or not away:
            continue
        fthg_raw = row.get('FTHG') or row.get('HG')
        ftag_raw = row.get('FTAG') or row.get('AG')
        if fthg_raw is None or ftag_raw is None or str(fthg_raw).strip() == '' or str(ftag_raw).strip() == '':
            continue
        
        home = TEAM_CANONICAL.get(home, home)
        away = TEAM_CANONICAL.get(away, away)
        fthg = int(fthg_raw)
        ftag = int(ftag_raw)
        
        m = {
            'country': country_code,
            'league_code': league_code,
            'league_name': league_name,
            'season': season_label,
            'date': row.get('Date', ''),
            'time': row.get('Time', ''),
            'homeTeam': home,
            'awayTeam': away,
            'referee': (row.get('Referee') or '').strip(),
            'fthg': fthg,
            'ftag': ftag,
            'ftr': (row.get('FTR') or row.get('Res') or ('H' if fthg > ftag else ('A' if fthg < ftag else 'D'))),
            'hthg': safe_int(row.get('HTHG')),
            'htag': safe_int(row.get('HTAG')),
            'htr':  (row.get('HTR') or '').strip(),
            'hs':  safe_int(row.get('HS')),
            'as':  safe_int(row.get('AS')),
            'hst': safe_int(row.get('HST')),
            'ast': safe_int(row.get('AST')),
            'hc': safe_int(row.get('HC')),
            'ac': safe_int(row.get('AC')),
            'hy': safe_int(row.get('HY')),
            'ay': safe_int(row.get('AY')),
            'hr': safe_int(row.get('HR')),
            'ar': safe_int(row.get('AR')),
            'hf': safe_int(row.get('HF')),
            'af': safe_int(row.get('AF')),
            'b365h': safe_float(row.get('B365H') or row.get('B365CH')),
            'b365d': safe_float(row.get('B365D') or row.get('B365CD')),
            'b365a': safe_float(row.get('B365A') or row.get('B365CA')),
            'maxh':  safe_float(row.get('MaxH') or row.get('MaxCH')),
            'maxd':  safe_float(row.get('MaxD') or row.get('MaxCD')),
            'maxa':  safe_float(row.get('MaxA') or row.get('MaxCA')),
            'avgh':  safe_float(row.get('AvgH') or row.get('AvgCH')),
            'avgd':  safe_float(row.get('AvgD') or row.get('AvgCD')),
            'avga':  safe_float(row.get('AvgA') or row.get('AvgCA')),
            'b365_over25': safe_float(row.get('B365>2.5') or row.get('B365C>2.5')),
            'b365_under25': safe_float(row.get('B365<2.5') or row.get('B365C<2.5')),
        }
        matches.append(m)
    return matches

steps_cfg = [
    ('ENG', 'E0', 'İngiltere Premier League', '245'),
    ('ESP', 'SP1', 'İspanya La Liga', '256'),
    ('GER', 'D1', 'Almanya Bundesliga', '258'),
    ('ITA', 'I1', 'İtalya Serie A', '260'),
    ('FRA', 'F1', 'Fransa Ligue 1', '262'),
    ('TR',  'T1', 'Türkiye Süper Lig', '264'),
    ('GRE', 'G1', 'Yunanistan Super League', '266'),
    ('ITA', 'I2', 'İtalya Serie B', '268'),
    ('BEL', 'B1', 'Belçika Pro League', '272'),
    ('NED', 'N1', 'Hollanda Eredivisie', '274'),
    ('POR', 'P1', 'Portekiz Liga Portugal', '276'),
    ('SCO', 'SC0', 'İskoçya Premiership', '278'),
]

new_matches = []
for c_code, l_code, l_name, step_num in steps_cfg:
    p = os.path.join(brain_dir, step_num, 'content.md')
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
        parsed = parse_main_csv(lines, c_code, l_code, l_name)
        print(f'{l_name}: {len(parsed)} maç başarıyla çözümlendi.')
        new_matches.extend(parsed)

COUNTRY_MAP = {
    'argentina': 'ARG', 'brazil': 'BRA', 'denmark': 'DNK', 'mexico': 'MEX',
    'norway': 'NOR', 'poland': 'POL', 'romania': 'ROU', 'russia': 'RUS',
    'sweden': 'SWE', 'usa': 'USA', 'austria': 'AUT', 'china': 'CHN',
    'finland': 'FIN', 'ireland': 'IRL', 'japan': 'JPN', 'switzerland': 'SWZ',
}
p_latest = os.path.join(brain_dir, '270', 'content.md')
if os.path.exists(p_latest):
    with open(p_latest, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
    csv_lines = [l for l in lines if 'Country,' in l or 'Argentina,' in l or 'Brazil,' in l or ',' in l]
    s_idx = 0
    for idx, l in enumerate(csv_lines):
        if 'Country,' in l or 'Home,' in l:
            s_idx = idx
            break
    reader = csv.DictReader(io.StringIO(''.join(csv_lines[s_idx:])))
    l_cnt = 0
    for row in reader:
        c_raw = str(row.get('Country', '')).strip().lower()
        if not c_raw or c_raw not in COUNTRY_MAP: continue
        c_code = COUNTRY_MAP[c_raw]
        home = (row.get('Home') or row.get('HomeTeam', '')).strip()
        away = (row.get('Away') or row.get('AwayTeam', '')).strip()
        hg = row.get('HG') or row.get('FTHG')
        ag = row.get('AG') or row.get('FTAG')
        if not home or not away or hg is None or ag is None or str(hg).strip() == '' or str(ag).strip() == '':
            continue
        home = TEAM_CANONICAL.get(home, home)
        away = TEAM_CANONICAL.get(away, away)
        fthg, ftag = int(hg), int(ag)
        m = {
            'country': c_code,
            'league_code': c_code,
            'league_name': str(row.get('League', f'{c_code} League')).strip(),
            'season': '2026/2027',
            'date': row.get('Date', ''),
            'time': row.get('Time', ''),
            'homeTeam': home,
            'awayTeam': away,
            'referee': '',
            'fthg': fthg, 'ftag': ftag,
            'ftr': row.get('Res') or ('H' if fthg > ftag else ('A' if fthg < ftag else 'D')),
            'hthg': 0, 'htag': 0, 'htr': '',
            'hs': 0, 'as': 0, 'hst': 0, 'ast': 0,
            'hc': 0, 'ac': 0, 'hy': 0, 'ay': 0, 'hr': 0, 'ar': 0, 'hf': 0, 'af': 0,
            'b365h': safe_float(row.get('B365CH') or row.get('PSCH')),
            'b365d': safe_float(row.get('B365CD') or row.get('PSCD')),
            'b365a': safe_float(row.get('B365CA') or row.get('PSCA')),
            'maxh': safe_float(row.get('MaxCH')),
            'maxd': safe_float(row.get('MaxCD')),
            'maxa': safe_float(row.get('MaxCA')),
            'avgh': safe_float(row.get('AvgCH')),
            'avgd': safe_float(row.get('AvgCD')),
            'avga': safe_float(row.get('AvgCA')),
            'b365_over25': None, 'b365_under25': None,
        }
        new_matches.append(m)
        l_cnt += 1
    print(f'Latest_Results: {l_cnt} ek maç eklendi.')

print(f'Toplam yeni çekilen maç sayısı: {len(new_matches)}')

matches_path = os.path.join(base_dir, 'matches_2026_2027.json')
with open(matches_path, 'r', encoding='utf-8') as f:
    existing_matches = json.load(f)

match_map = {}
for m in existing_matches:
    k = get_match_key(m)
    match_map[k] = m

added = 0
updated = 0
for m in new_matches:
    k = get_match_key(m)
    if k in match_map:
        for k2, v2 in m.items():
            if v2 is not None and v2 != 0 and v2 != '':
                match_map[k][k2] = v2
        updated += 1
    else:
        match_map[k] = m
        added += 1

all_final = list(match_map.values())
print(f'Birleştirme bitti! Yeni eklenen: {added}, Güncellenen: {updated}, Toplam maç: {len(all_final)}')

with open(matches_path, 'w', encoding='utf-8') as f:
    json.dump(all_final, f, ensure_ascii=False, indent=2)
print('matches_2026_2027.json başarıyla güncellendi!')
