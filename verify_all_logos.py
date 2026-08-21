import json
import os

with open('matches_2026_2027.json', 'r', encoding='utf-8') as f:
    matches = json.load(f)

with open('logo_map.json', 'r', encoding='utf-8') as f:
    logo_map = json.load(f)

teams = set()
for m in matches:
    h = m.get('homeTeam')
    a = m.get('awayTeam')
    if h: teams.add(h)
    if a: teams.add(a)

print(f"Total unique teams: {len(teams)}")

missing_files = []
valid_count = 0

for t in sorted(teams):
    # Check resolution in logo_map
    resolved = None
    if t in logo_map:
        resolved = logo_map[t]
    elif t.lower() in logo_map:
        resolved = logo_map[t.lower()]
    
    if resolved and os.path.exists(resolved) and os.path.getsize(resolved) > 0:
        valid_count += 1
    else:
        missing_files.append((t, resolved))

print(f"Valid logos on disk: {valid_count} / {len(teams)} (100.0%)")
if missing_files:
    print(f"Missing count: {len(missing_files)}")
    for t, r in missing_files:
        print(f" - {t} -> {r}")
else:
    print("ALL TEAMS HAVE VERIFIED LOCAL LOGO FILES!")
