# from ssl import Options

import requests
from bs4 import BeautifulSoup
import json
import time
import pandas as pd
import re
from urllib.parse import unquote
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


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

#def fGetTopFilmLinks(iFrom):
    # if (iFrom):
    #     sUrl = RANK_URL + "?from=" + str(iFrom)
    # else:
    #     sUrl = RANK_URL
    
def fGetTopFilmLinks(sUrl):
    
    # r = requests.get(sUrl, headers=headers)
    # soup = BeautifulSoup(r.text, "html.parser")
    soup = fGetSoup(sUrl)
    
    links = []

    for a in soup.select('a[href^="/film/"][href$="/prehled/"]'):
        url = BASE + a["href"]
        if url not in links:
            links.append(url)

    return links


def fExtractPeople(data):

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



def fGetSoup(sUrl, sMethod="requests"):
    headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive"
    }
    
    if sMethod=="requests":
        try:
            r = requests.get(sUrl, headers=headers)
        except Exception as e:
            time.sleep(60)
            r = requests.get(sUrl, headers=headers)
        
        soup = BeautifulSoup(r.text, "html.parser")
        return soup
    
    if sMethod=="selenium":
        try:
            options = Options()
            options.add_argument("--headless=new")  # 👈 modern headless mode
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            driver = webdriver.Chrome(options=options)
            driver.get(sUrl)

            time.sleep(3)

            html = driver.page_source
            soup = BeautifulSoup(html, "html.parser")
            driver.quit()
            return soup
        except Exception as e:
             print("Error with Selenium:", e)
             return None

data = {'model': 'prehraj.to', 
    'prompt': 'https://prehraj.to/hledej/Termin%C3%A1tor%202%3A%20Den%20z%C3%BA%C4%8Dtov%C3%A1n%C3%AD%20dabing%201991', 
}
         
def fExtractFromYouTube(sUrl, iCount=3):
    # sUrl = "https://www.youtube.com/results?search_query=%C5%BDena+je+%C5%BEena+dabing+1961"
    sDomain = 'https://' + sUrl.split("/")[2]
    soup = fGetSoup(sUrl, sMethod="selenium")
    lstLinks = soup.find_all(
        "a", href=lambda h: h and h.startswith("/watch"),
        attrs={ "aria-label": lambda x: x and "trailer" not in x.lower()})
    lxd = [
        {"sLabel": a.get("aria-label"), "sUrl": sDomain + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks ]
    return lxd[:iCount]

def fExtractFromPrehrajto(sUrl, iCount=3):
    # sUrl = "https://prehraj.to/hledej/%C5%BDena%20je%20%C5%BEena%20dabing%201961"
    sDomain = 'https://' + sUrl.split("/")[2]
    soup = fGetSoup(sUrl, sMethod="requests")
    lstLinks = soup.find_all("a", class_=lambda c: c and c.startswith("video"))
    lxd = [
        {"sLabel": a.attrs['title'], "sUrl": sDomain + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks ]
    return lxd[:iCount]

def fExtractFromSledujteto(sUrl, iCount=3):
    # sUrl = "https://www.sledujteto.cz/vyhledat/?search=zena+je+zena+1961&page=1"
    sDomain = 'https://' + sUrl.split("/")[2]
    soup = fGetSoup(sUrl, sMethod="selenium")
    lstLinks = soup.find_all("a", href=lambda h: h and h.startswith("/file/"))
    lxd = [
        {"sLabel": a.attrs['title'], "sUrl": sDomain + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks ]
    return lxd[:iCount]


match data['model']:
    case 'youtube':
        lxdLinks = fExtractFromYouTube(data['prompt'])
    case 'prehraj.to':
        lxdLinks = fExtractFromPrehrajto(data['prompt'])
    case 'sledujteto.cz':
        lxdLinks = fExtractFromSledujteto(data['prompt'])
    case _:
        lxdLinks = []
        
x = lxdLinks   



links = fExtractFromSledujteto('', iCount=3)


if lstHrefs:
    
    print("Stream links found:")
    for href in lstHrefs:
        print(unquote(href))
data = json.loads(soup.find("script", {"type": "application/ld+json"}).string)
print(fExtractPeople(data))


def fScrapeFilm(sUrl):
    headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
    "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive"
    }
    options = Options()
    options.add_argument("--headless=new")  # 👈 modern headless mode
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    
    sUrl = sUrl + 'prehled/'
    # sUrl = 'https://www.csfd.cz/film/1248-terminator-2-den-zuctovani/prehled/'
    
    driver = webdriver.Chrome(options=options)
    driver.get(sUrl)

    time.sleep(3)

    html = driver.page_source
    soup = BeautifulSoup(html, "html.parser")
    
    # try:
    #     r = requests.get(sUrl, headers=headers)
    # except Exception as e:
    #     time.sleep(60)
    #     r = requests.get(sUrl, headers=headers)
    
    
    # soup = BeautifulSoup(r.text, "html.parser")

    script = soup.find("script", {"type": "application/ld+json"})
    driver.quit()
    
    if not script:
        return None

    data = json.loads(script.string)

    film = {
        "idCsfd": int(re.search(r"/film/(\d+)-", sUrl).group(1)),
        "sTitle": data.get("name"),
        "iYear": int(data.get("dateCreated")) if data.get("dateCreated") else None,
        "iRating": data.get("aggregateRating", {}).get("ratingValue"),
        "iRuntime": int(re.search(r"PT(\d+)M", data.get("duration")).group(1)) if data.get("duration") else None,
        "urlPoster": data.get("image"),
        "urlCsfd": sUrl.replace("/prehled/", "/").replace("/oceneni/", "/")
    }
    m = re.match(r"^(.*)\s\((\d{4})\)$", film["sTitle"])
    if m:
        film["sTitle"] = m.group(1)

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
        
    
    film.update(fExtractPeople(data))

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

def fReadCsv(sFileName):
    try:
        df = pd.read_csv(sFileName, sep=';', encoding='utf-8-sig')
        return df.to_dict(orient='records')
    except Exception as e:
        print("Error reading CSV:", e)
        return []
    
def fGetNewMovies(lxd):
    for d in lxd:
        sUrl = d['urlCsfd']
        dct = fScrapeFilm(sUrl)
        

    return lxd
    
get_top_film_links = fGetTopFilmLinks('https://www.csfd.cz/film/1248-terminator-2-den-zuctovani/prehled/')

sFilmMoviesCsv = './data/movies_series.csv' 
lxdMovies = fReadCsv(sFilmMoviesCsv)
fGetNewMovies(lxdMovies)

print("Loading ranking page...")
lstAllFilmLinks = []
# for i in range(800, 1000, 100):
#     print("Loading ranking page from", i, "...")
#     lstAllFilmLinks.extend(fGetTopFilmLinks(i))

lstAllFilmLinks.extend(fGetTopFilmLinks(RANK_URL))
lstAllFilmLinks.extend(fGetTopFilmLinks(RANK_URL + "?page=2"))

print("Films found:", len(lstAllFilmLinks))

lxd = []

for i, url in enumerate(lstAllFilmLinks): 

    print(i+1, "/", len(lstAllFilmLinks), url)

    film = fScrapeFilm(url.replace("/prehled/", "/oceneni/"))

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