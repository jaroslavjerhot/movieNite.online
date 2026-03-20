import csv
import json
from unidecode import unidecode
import re

def fNormalize(s):
    s = unidecode(s.lower())
    s = re.sub(r"[^a-z0-9 ]", "", s)
    s = s.replace('y','i').replace(' ','')
    return s


dctCountryContinent = {}
dctCountryFormer = {}
with open("./data/country-continent.csv", "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter=";")
    for row in reader:
        country = row["sCountry"]
        continent = row["sContinent"]
        former = row["sFormerCountry"]
        if country and continent:
            dctCountryContinent[country] = continent
        if country and former:
            dctCountryFormer[country] = former

with open("./data/movies_series.csv", "r", encoding="utf-8-sig", newline="") as f:
    reader = csv.DictReader(f, delimiter=";")
    lxdMovies = list(reader)

sSep = ', '    
for dctMovie in lxdMovies:
    # remap country to group
    dctMovie["sCountry"] = dctMovie["sCountry"].replace(' / ', sSep)
    if 'Německ' in dctMovie["sCountry"] and 'Německo' not in dctMovie["sCountry"]:
        dctMovie["sCountry"] = dctMovie["sCountry"] + sSep + "Německo"
    if 'Sovětsk' in dctMovie["sCountry"] and 'Rusko' not in dctMovie["sCountry"]:
        dctMovie["sCountry"] = dctMovie["sCountry"] + sSep + "Rusko"
    if 'Protektorát' in dctMovie["sCountry"] and 'Československo' not in dctMovie["sCountry"]:
        dctMovie["sCountry"] = dctMovie["sCountry"] + sSep + "Československo"
    # remap country to continent
    lstCountry = dctMovie["sCountry"].split(sSep) if dctMovie["sCountry"] else []
    lstContinent = []
    for country in lstCountry:
        if country in dctCountryContinent:
            if dctCountryContinent[country] not in lstContinent:
                lstContinent.append(dctCountryContinent[country])
    dctMovie["sContinent"] = sSep.join(lstContinent) if lstContinent else ""
    
    # remap academy awards to oscar
    dctMovie['sNominated'] = dctMovie['sNominated'].replace("Academy Awards", "Oscar")
    dctMovie['sAwarded'] = dctMovie['sAwarded'].replace("Academy Awards", "Oscar")

    # unaccent title
    dctMovie["sTitleUnaccent"] = fNormalize(dctMovie["sTitle"])


with open("./data/movies_series.json", "w", encoding="utf-8") as f:
    json.dump(lxdMovies, f, ensure_ascii=False)