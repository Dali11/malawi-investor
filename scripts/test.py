import requests
import re

html = requests.get(
    "https://afx.kwayisi.org/chart/mse/airtel",
    headers={"User-Agent": "Mozilla/5.0"}
).text

pattern = re.compile(
    r'd\("([^"]+)"\),([0-9.]+)'
)

matches = pattern.findall(html)

print("Found:", len(matches))

if matches:
    print(matches[:5])