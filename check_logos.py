import json
import os
import re

# Load matches
with open('matches_2026_2027.json', 'r', encoding='utf-8') as f:
    matches = json.load(f)

teams_by_country = {}
all_teams = set()
for m in matches:
    country = m.get('country', 'UNKNOWN')
    league = m.get('league_name', 'UNKNOWN')
    h = m.get('homeTeam')
    a = m.get('awayTeam')
    if h:
        all_teams.add(h)
        teams_by_country.setdefault(country, set()).add(h)
    if a:
        all_teams.add(a)
        teams_by_country.setdefault(country, set()).add(a)

print(f"Total unique teams across all leagues: {len(all_teams)}")
for c, tms in sorted(teams_by_country.items()):
    print(f"Country {c}: {len(tms)} teams")

existing_logos = set(os.listdir('logos'))
print(f"Total files in logos/: {len(existing_logos)}")

# Load local_logo_map.js
logo_map = {}
with open('local_logo_map.js', 'r', encoding='utf-8') as f:
    text = f.read()
    # parse key-value pairs
    for line in text.splitlines():
        m = re.search(r'["\']([^"\']+)["\']\s*:\s*["\']([^"\']+)["\']', line)
        if m:
            logo_map[m.group(1).strip()] = m.group(2).strip()

print(f"Keys in local_logo_map: {len(logo_map)}")

def slugify(name):
    tr_map = {'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'İ': 'i', 'I': 'i', 'é':'e', 'á':'a', 'í':'i', 'ó':'o', 'ú':'u', 'ñ':'n', 'ä':'a', 'ë':'e', 'ï':'i', 'ö':'o', 'ü':'u'}
    s = name.lower()
    for k, v in tr_map.items():
        s = s.replace(k, v)
    return re.sub(r'[^a-z0-9]', '', s)

# Let's check which team actually has a working logo file that exists on disk
valid_teams = []
missing_teams = []

for t in sorted(all_teams):
    slug = slugify(t)
    resolved_path = None
    
    # 1. Check direct map
    if t in logo_map:
        p = logo_map[t]
        if os.path.exists(p):
            resolved_path = p
    elif t.lower() in logo_map:
        p = logo_map[t.lower()]
        if os.path.exists(p):
            resolved_path = p
    elif slug in logo_map:
        p = logo_map[slug]
        if os.path.exists(p):
            resolved_path = p
    else:
        # Check slug in existing logos
        for ext in ['.png', '.svg', '.jpg', '.webp']:
            if f"{slug}{ext}" in existing_logos:
                resolved_path = f"logos/{slug}{ext}"
                break
    
    if resolved_path:
        valid_teams.append((t, resolved_path))
    else:
        missing_teams.append(t)

print(f"\nTeams with valid existing logo file: {len(valid_teams)}")
print(f"Teams MISSING logo file: {len(missing_teams)}")
print("\nList of missing teams:")
for t in missing_teams:
    print(f" - {t}")
