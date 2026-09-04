import re

extra_mappings = {
    "corum": "logos/corumfk.png",
    "corum fk": "logos/corumfk.png",
    "atl. madrid": "logos/athmadrid.png",
    "atletico madrid": "logos/athmadrid.png",
    "dep. a coruna": "logos/deportivoacoruna.png",
    "deportivo la coruna": "logos/deportivoacoruna.png",
    "bradford city": "logos/bradford.png",
    "bradford": "logos/bradford.png",
    "celta b": "logos/celta.png",
    "celta vigo b": "logos/celta.png",
    "sheffield wed": "logos/sheffieldweds.png",
    "sheffield wednesday": "logos/sheffieldweds.png",
    "arezzo": "logos/arezzo.svg",
    "ascoli": "logos/ascoli.svg",
    "benevento": "logos/benevento.svg",
    "sabadell": "logos/sabadell.svg",
    "vicenza": "logos/vicenza.svg"
}

with open("local_logo_map.js", "r", encoding="utf-8") as f:
    content = f.read()

# insert before };
lines = []
for k, v in extra_mappings.items():
    lines.append(f'  "{k}": "{v}",')

insert_str = "\n".join(lines) + "\n"
idx = content.rfind("};")
if idx != -1:
    new_content = content[:idx] + insert_str + content[idx:]
    with open("local_logo_map.js", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("local_logo_map.js güncellendi!")
else:
    print("Hata: }; bulunamadı")
