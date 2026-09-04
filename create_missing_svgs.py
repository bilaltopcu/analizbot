import os

svg_templates = {
    'arezzo': ('SS Arezzo', '#800020', '#ffffff', 'SSA'),
    'ascoli': ('Ascoli Calcio', '#000000', '#ffffff', 'ASC'),
    'benevento': ('Benevento Calcio', '#e60000', '#ffcc00', 'BEN'),
    'sabadell': ('CE Sabadell', '#0047ab', '#ffffff', 'CES'),
    'vicenza': ('LR Vicenza', '#d90000', '#ffffff', 'LRV'),
}

for slug, (team_name, bg_color, text_color, initials) in svg_templates.items():
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad_{slug}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_color}" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#grad_{slug})" stroke="{text_color}" stroke-width="4"/>
  <text x="64" y="72" font-family="Outfit, Arial, sans-serif" font-size="32" font-weight="900" fill="{text_color}" text-anchor="middle">{initials}</text>
</svg>"""
    p = os.path.join('logos', f'{slug}.svg')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"Oluşturuldu: {p}")
