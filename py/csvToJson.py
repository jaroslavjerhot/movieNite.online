import csv
import json

with open("./data/movies_series.csv", "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter=";")
    lxd = list(reader)

with open("./data/movies_series.json", "w", encoding="utf-8") as f:
    json.dump(lxd, f, ensure_ascii=False)