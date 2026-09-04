with open("local_logo_map.js", "r", encoding="utf-8") as f:
    content = f.read()
idx = content.rfind("};")
new_content = content[:idx] + '  "erzurumspor": "logos/erzurumsporfk.png",\n' + content[idx:]
with open("local_logo_map.js", "w", encoding="utf-8") as f:
    f.write(new_content)
print("Erzurumspor eklendi!")
