import requests
from bs4 import BeautifulSoup
import json
import time
import pandas as pd
import re
from urllib.parse import unquote

BASE = "https://www.csfd.cz"
RANK_URL = "https://www.csfd.cz/zebricky/filmy/nejlepsi/"
RANK_URL = "https://www.csfd.cz/zebricky/serialy/nejlepsi/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-fantasy-filmy/"

RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-akcni-filmy/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-katastroficke-filmy/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-komedie/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-zivotopisne-filmy/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-scifi-filmy/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-dokumentarni-filmy/"
RANK_URL = "https://www.csfd.cz/zebricky/nejlepsi-muzikaly/"
# RANK_URL = ""

headers = {
    "User-Agent": "Mozilla/5.0"
}

sNow = time.strftime("%Y-%m-%d-%H-%M-%S")
sFileName = f"data/csfd_muzikaly_{sNow}.csv"

#def get_top_film_links(iFrom):
    # if (iFrom):
    #     sUrl = RANK_URL + "?from=" + str(iFrom)
    # else:
    #     sUrl = RANK_URL
    
def get_top_film_links(sUrl):
        
    
    
    r = requests.get(sUrl, headers=headers)
    soup = BeautifulSoup(r.text, "html.parser")

    links = []

    for a in soup.select('a[href^="/film/"][href$="/prehled/"]'):
        url = BASE + a["href"]
        if url not in links:
            links.append(url)

    return links


def extract_people(data):

    people = {}

    for key, value in data.items():

        if isinstance(value, list):

            persons = []

            for v in value:
                if isinstance(v, dict) and v.get("@type") == "Person":
                    persons.append(v.get("name"))

            if persons:
                people['s' + key.capitalize()] = ", ".join(persons)

    return people


def extract_stream_links(soup):

    platforms = {}
    sPlatforms =''

    for a in soup.find_all("a", href=True):

        href = a["href"]

        if any(p in href.lower() for p in [
            "netflix",
            "apple",
            "itunes",
            "amazon",
            "youtube",
            "google",
            "hbo",
            "disney",
            "iprima",
            "voyo",
            "filmbox",
            "ivysilani"
            "oneplay",
            "ceskatelevize",
            "skyshowtime",
        ]):

            # platforms['urlVid' + href.split(".")[1].capitalize()] = href
            sPlatforms += unquote(href) + "<br>"
    return {'sPlatforms': sPlatforms}


def scrape_film(url):

    try:
        r = requests.get(url, headers=headers)
    except Exception as e:
        time.sleep(60)
        r = requests.get(url, headers=headers)
    
    
    soup = BeautifulSoup(r.text, "html.parser")

    script = soup.find("script", {"type": "application/ld+json"})
    
    if not script:
        return None

    data = json.loads(script.string)

    film = {
        "idCsfd": int(re.search(r"/film/(\d+)-", url).group(1)),
        "sTitle": data.get("name"),
        "iYear": int(data.get("dateCreated")) if data.get("dateCreated") else None,
        "iRating": data.get("aggregateRating", {}).get("ratingValue"),
        "iRuntime": int(re.search(r"PT(\d+)M", data.get("duration")).group(1)) if data.get("duration") else None,
        "urlPoster": data.get("image"),
        "urlCsfd": url.replace("/prehled/", "/").replace("/oceneni/", "/")
    }
    m = re.match(r"^(.*)\s\((\d{4})\)$", film["sTitle"])
    if m:
        film["sTitle"] = m.group(1)

    film['urlCsfd']
    film['sCountry'] = soup.find('div', class_="origin").text.split(',')[0].strip() if soup.find(class_="origin") else ""
    film["sGenre"] = soup.find('div', class_="genres").text.strip() if soup.find(class_="genres") else ""
    film['sTitle_EN'] = soup.find('ul', class_='film-names').find('li').text.replace('\t','').replace('\n','').replace('(více)','').strip() if soup.find('ul', class_='film-names') else ""
    
    film['sStory'] = soup.find('div', class_="plot-preview").text.replace('(oficiální text distributora)','').replace('(více)','').strip() if soup.find('div', class_="plot-preview") else ""
    
    if not(film['sStory']):
        film['sStory'] = soup.find('div', class_="plot-full").text.replace('(oficiální text distributora)','').replace('(více)','').strip() if soup.find('div', class_="plot-full") else ""
        
    film['sStory'] = re.sub(r"\s+", " ", film['sStory'])
    
    film['sCopyright'] = soup.find('div', class_="box-premieres-content").find_all('li')[-1].text.strip() if soup.find('div', class_="box-premieres-content") else ""
    film['sCopyright'] = re.sub(r"\s+", " ", film['sCopyright']).replace('V kinech od ','') if film['sCopyright'] else ""

    lstTags = soup.select('a[href^="/tag/"]')
    if lstTags:
        film['sTags'] = ", ".join([a.text.strip() for a in lstTags])
        
    # sEpisodes = soup.find("h3", string=re.compile("\Epizody\"))
    episodes = [h3.text.strip() for h3 in soup.find_all("h3") if "Epizody" in h3.text]
    if episodes:
        lst = episodes[0].split('/')
        if len(lst)==1:
            film['sSeries'] = 0
            film['sEpisodes'] = int(re.search(r"\((\d+)\)", lst[0]).group(1))
        if len(lst)==2:
            film['sSeries'] = int(re.search(r"\((\d+)\)", lst[0]).group(1))
            film['sEpisodes'] = int(re.search(r"\((\d+)\)", lst[1]).group(1))
        
    
    film.update(extract_people(data))

    film.update(extract_stream_links(soup))

    awards = soup.find_all("a", href=re.compile(r"^/oceneni/\d+-")) if soup.find_all("a", href=re.compile(r"^/oceneni/\d+-")) else None
    # lstMainAwards = ['Český lev', 'Academy Awards', 'Venice', 'Berlinale', 'Cannes', 'Sundance', 'Toronto', 'Karlovy Vary']
    film['sNominated'] = ""
    film['sWinner'] = ""
    if awards:
        for a in awards:
            sAwardName = a.text.strip()
            iNominated = len(a.parent.parent.find_all('li', class_="nominated"))
            iWinner = len(a.parent.parent.find_all('li', class_="winner"))
            if (iNominated>0):
                film['sNominated'] += sAwardName + " (" + str(iNominated) + "x)<br>"
            if (iWinner>0): 
                film['sWinner'] += sAwardName + " (" + str(iWinner) + "x)<br>"
            
    return film


print("Loading ranking page...")
lstAllFilmLinks = []
# for i in range(800, 1000, 100):
#     print("Loading ranking page from", i, "...")
#     lstAllFilmLinks.extend(get_top_film_links(i))

lstAllFilmLinks.extend(get_top_film_links(RANK_URL))
lstAllFilmLinks.extend(get_top_film_links(RANK_URL + "?page=2"))

print("Films found:", len(lstAllFilmLinks))

lxd = []

for i, url in enumerate(lstAllFilmLinks): 

    print(i+1, "/", len(lstAllFilmLinks), url)

    film = scrape_film(url.replace("/prehled/", "/oceneni/"))

    if film:
        lxd.append(film)

    if (i % 10 == 0):
        df = pd.DataFrame(lxd)
        df.to_csv(sFileName, index=False, sep=';', encoding='utf-8-sig')
        
    if (i % 100 == 0):
        time.sleep(4)

    time.sleep(1)
    if (i>200):
        break

df = pd.DataFrame(lxd)
df.to_csv(sFileName, index=False, sep=';', encoding='utf-8-sig')

print("Saved:", len(lxd), "films")