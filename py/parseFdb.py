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
import codecs
from datetime import datetime
import unicodedata
from unidecode import unidecode
from urllib.parse import quote

urlFdbBase = "https://www.fdb.cz/film/"
urlOceanBase = 'https://prod-fdb-storage.fra1.cdn.digitaloceanspaces.com/galleries/'
urlImdbBase = "https://www.imdb.com/title/"
urlJustWatchBase = "https://www.justwatch.com/cz/film/"
urlFilmMistaBase = "https://www.filmovamista.cz"
urlSledujtetoBase = "https://www.sledujteto.cz"
urlPrehrajtoBase = "https://prehraj.to"
urlCsfdBase = "https://www.csfd.cz/film/"
urlCsfdEmptyImage = "https://static.pmgstatic.com/assets/images/050b5bad23b8eb0b4f88f971b8f6a168/empty-image.svg"
urlPmgStaticBase = "https://image.pmgstatic.com/cache/resized/w420/files/images/film/posters/"    
urlFdbEmptyImage = "https://prod-fdb-storage.fra1.cdn.digitaloceanspaces.com/placeholders/General.png"

urlBase = "https://www.fdb.cz"
iPagesMax= 6240
iMaxInRound = 150
sType = "filmy"
urlMoviesChart = urlBase + f"/zebricky?obdobi=celkove&stranek={iPagesMax}&zalozka={sType}&razeni=nejlepsi&stranka=#iPage"

sFileChart =    "data/fdb_chart.csv"
sFileDetails =  "data/fdb_details.csv"
sFileCsfd =     "data/csfd_details.csv"
sFileNobels =   "data/nobels.csv"

def fGetLxdFromCsv(sFileName):
    try:
        df = pd.read_csv(sFileName, sep=';', encoding='utf-8-sig')
        return df.to_dict(orient='records')
    except Exception as e:
        print("Error reading CSV:", e)
        return []

def fSaveLxdToCsv(lxd, sFileName, bSecondTry=False):
    try:
        df = pd.DataFrame(lxd)
        df.to_csv(sFileName, index=False, sep=';', encoding='utf-8-sig')
    except Exception as e:
        print("Error saving CSV:", e)
        
        if not bSecondTry:
            print("Trying to save with new filename...")
            sNow = time.strftime("%Y-%m-%d-%H-%M-%S")
            fSaveLxdToCsv(lxd, sFileName + f"_{sNow}.csv", bSecondTry=True)

lxdChart = fGetLxdFromCsv(sFileChart)
lxdDetails = fGetLxdFromCsv(sFileDetails)
lxdCsfd = fGetLxdFromCsv(sFileCsfd)
lxdNobels = fGetLxdFromCsv(sFileNobels)


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

def fNormalize(s, bRemoveSpaces = True):
    result = unidecode(s.lower())
    result = result.replace('.','').replace(',','').replace(':','').replace(';','').replace('!','').replace('?','').replace('\'','').replace('"','').replace('_','')
    result = result.replace('  ',' ').replace('  ',' ')
    if bRemoveSpaces:
        result = result.replace(' ','')
    return result

         
def fExtractFromYouTube(sUrl, iCount=3):
    # sUrl = "https://www.youtube.com/results?search_query=%C5%BDena+je+%C5%BEena+dabing+1961"
    sDomain = 'https://' + sUrl.split("/")[2]
    soup = fGetSoup(sUrl, sMethod="selenium")
    if not soup:
        return []
    lstLinks = soup.find_all(
        "a", href=lambda h: h and h.startswith("/watch"),
        attrs={ "aria-label": lambda x: x and "trailer" not in x.lower()})
    lxd = [
        {"sLabel": a.get("aria-label"), "sUrl": sDomain + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks ]
    return lxd[:iCount]

def fExtractFromPrehrajto(sNormTitle, sSearchTitle):
    urlBase = urlPrehrajtoBase
    # sSearchTitle = quote(sSearchTitle)
    sUrl = f"{urlBase}/hledej/{sSearchTitle}"
    soup = fGetSoup(sUrl, sMethod="requests")
    if not soup:
        return ''
    lstLinks = soup.find_all("a", class_=lambda c: c and c.startswith("video"))
    lxd = [
        {"sNormTitle": fNormalize(a.attrs['title'], True), "sUrl": urlBase + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks]
    lxd = [d for d in lxd if sNormTitle in d['sNormTitle']]
    return lxd[0]['sUrl'].replace(urlBase, '') if lxd else ''

def fExtractFromSledujteto(sNormTitle, sSearchTitle):
    urlBase = urlSledujtetoBase
    sUrl = f"{urlBase}/vyhledat/?search={sSearchTitle}&page=1"
    soup = fGetSoup(sUrl, sMethod="selenium")
    if not soup:
        return ''
    lstLinks = soup.find_all("a", href=lambda h: h and h.startswith("/file/"))
    lxd = [
        {"sNormTitle": fNormalize(a.attrs['title'], True), "sUrl": urlBase + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks ]
    lxd = [d for d in lxd if sNormTitle in d['sNormTitle']] 
    return lxd[0]['sUrl'].replace(urlBase, '') if lxd else ''

def fExtractFromFilmMista(sNormTitle, sSearchTitle):
    urlBase = urlFilmMistaBase
    sUrl = f"{urlBase}/vyhledavani?q={sSearchTitle}&submint=Hledat"
    soup = fGetSoup(sUrl, sMethod="selenium")
    if not soup:
        return ''
    lstLinks = soup.find_all("a", href=lambda h: h and "/film/lokalita" in h)
    lxd = [
        {"sNormTitle": fNormalize(a.text.strip(), True), "sUrl": urlBase + a.get("href") if a.get("href").startswith("/") else a.get("href")}
        for a in lstLinks ]
    lxd = [d for d in lxd if sNormTitle in d['sNormTitle']]
    return lxd[0]['sUrl'].replace(urlBase, '').replace('/film/lokalita?id=', '') if lxd else ''

def fSearchTitle(dct):
    sSearchTitle = dct['sTitle'] + \
        (" dabing" if dct['bCzDabing'] else "") + \
        (" titulky" if dct['bCzSubtitles'] and not dct['bCzDabing'] else "") + \
        " " + str(dct['iYear'] if dct['iYear'] else '')
    return quote(sSearchTitle)


def fGetMovieLxdFromPage(iPage):
    
    url = urlMoviesChart.replace("#iPage", str(iPage))
    soup = fGetSoup(url)
    
    lxd = []
    lstAhrefs =soup.select('a[href^="/film/"]')
    lstDivs = [a.find_parent("div") for a in lstAhrefs]
    
    for d in lstDivs:
        dctMovie = {}
        a = d.find("a", href=True)
        
        dctMovie['idFdb'] = a['href'].split('/')[-1].split('-')[0]
         
        if dctMovie['idFdb'] in [m.get('idFdb') for m in lxdChart]:
            continue
        
        dctMovie['urlFdb'] = urlBase + a["href"]
        divParent = d.find_parent("div")
        lstP = divParent.find_all("p")
        dctMovie['iRating'] = int(float(divParent.find('span').text.replace(',','.'))*10) if divParent.find('span') else 0
        dctMovie['sTitle'] = lstP[0].text.strip() if len(lstP)>0 else ""
        dctMovie['iYear'], dctMovie['sCountry'] = lstP[1].text.split("\xa0") if (len(lstP)>1 and "\xa0" in lstP[1].text) else (lstP[1].text, "")
        dctMovie['sGenre'] = lstP[2].text.strip() if len(lstP)>2 else ""
        dctMovie['sGenre'] = dctMovie['sGenre'].replace(', ',' / ').title()
        
        urlImg = divParent.find_parent("div").find("img")["src"] if divParent.find_parent("div").find("img") else ""
        sImgId = urlImg.split('/')[-1].split('.')[0] if urlImg else ""
        iSize = 512
        dctMovie['urlPoster'] = f"https://prod-fdb-storage.fra1.cdn.digitaloceanspaces.com/thumbnails/w{iSize}/galleries/{sImgId}.jpeg" if sImgId else ""
        dctMovie['iPage'] = iPage
        print(str(iPage) + ': ' + dctMovie["sTitle"] + ', ' + dctMovie["iYear"] + '\n\t' + dctMovie["sGenre"] + ', ' + str(dctMovie["iRating"]))
        
        lxd.append(dctMovie)

    return lxd

def fGetMovieChart():
    iPageStart = max([m.get('iPage', 0) for m in lxdChart]) if lxdChart else 0
    for iPage in range(iPageStart + 1, iPagesMax+1):
        sNow = time.strftime("%Y-%m-%d %H:%M:%S")
        print("-----------------------------")
        print(sNow, "Loading page", iPage, "of", iPagesMax)
        lxd = fGetMovieLxdFromPage(iPage)
        lxdChart.extend(lxd)
        fSaveLxdToCsv(lxdChart, sFileChart)
        time.sleep(2)
        
        if ((iPage- iPageStart) % iMaxInRound == 0):
            print("Waiting: 60 seconds...")
        
            time.sleep(60)
    print("Total films found:", len(lxdChart))

def fGetMoviesDetails():
    
    lstChartUrls = [m.get('urlFdb') if 'Česko' in str(m.get('sCountry','')) else None for m in lxdChart if m.get('urlFdb') ]
    lstDetailsUrls = [m.get('urlFdb') for m in lxdDetails if m.get('urlFdb')]
    lstNormCsfdTitles = [fNormalize(m.get('sTitle', ''), True) for m in lxdCsfd]
    lstNormNobelNames = [fNormalize(m.get('sName', ''), True) for m in lxdNobels]
    
    for i, sUrl in enumerate(lstChartUrls):   
        if i<7797 or sUrl in lstDetailsUrls or sUrl is None:
            continue
        print(i+1, "/", len(lstChartUrls), sUrl)
        dctMovie = {}
        soup = fGetSoup(urlFdbBase + sUrl)
        # soup = fGetSoup('https://www.fdb.cz/film/12192-ostre-sledovane-vlaky')
        try:
            dctDescr = json.loads(soup.find("script", {"type": "application/ld+json"}).string)
        except Exception as e:
            dctDescr = {}
        
        try:
            sAuthor = soup.find("script", string=lambda s: s and "Tvůrci" in s).get_text()
            sAuthor = codecs.decode(sAuthor, "unicode_escape")
            sAuthor = sAuthor.encode("latin1").decode("utf-8")
            sAuthor = sAuthor.replace('\\n', '').replace('\\t', '')
            sAuthor = sAuthor.replace('self.__next_f.push([1,"3b:["$","div",null,','')
            sAuthor = sAuthor.replace(']\n"])', '')
            json_part = json.loads(sAuthor)
            lst = json_part["children"][1][3]['children']
            lstPos = [a[2].split('-')[1] for a in lst]
            lstAuthors = [a[3]['children'][1][3]['children'][0][3]['children'] for a in lst ]
            
            sAuthor = lstAuthors[lstPos.index('námět')] if 'námět' in lstPos else ''
        except Exception as e:
            sAuthor = ''
        
        # json_part = json.loads(sAuthor)
        # dct = json_part[3]["children"][3]['mediaTitle']
        
        try:
            sMain = soup.find("script", string=lambda s: s and "imdbUrl" in s).get_text()
            sMain = re.search(r'push\(\[.*?,"(.*?)"\]\)', sMain).group(1) if sMain else None
            sMain = codecs.decode(sMain, "unicode_escape")
            sMain = sMain.encode("latin1").decode("utf-8")
            sMain = sMain.split(":", 1)[1]
            json_part = json.loads(sMain)
            dct = json_part[3]["children"][3]['mediaTitle']
        except Exception as e:
            continue
            
        dctMain = dct.get('baseInfo', {}) | dct.get('extraInfo', {}) | dct.get('schemaInfo', {}) 
        
        dctMovie['idFdb'] = dctMain.get('id', '')
        dctMovie['sTitle'] = dctMain.get('title', '')
        sNormTitle = fNormalize(dctMovie['sTitle'], True)
        if sNormTitle in lstNormCsfdTitles:
            iCsfdIndex = lstNormCsfdTitles.index(sNormTitle)
            dctMovie['idCsfd'] = lxdCsfd[iCsfdIndex].get('idCsfd')
            dctMovie['urlCsfd'] = lxdCsfd[iCsfdIndex].get('urlCsfd', '').replace(urlCsfdBase, '')
        else:
            iCsfdIndex = -1
            dctMovie['idCsfd'] = 0
            dctMovie['urlCsfd'] = ''
            
        
        # dctMovie['sType'] = dctMain.get('mediaType', '')[0].lower() if dctMain.get('mediaType') else ''
        dctMovie['sType'] = 'm'
        dctMovie['iYear'] = dctMain.get('year', 0)
        dctMovie['iRating'] = dctMain.get('ratingAverage', 0)*10
        dctMovie['iRuntime'] = dctMain.get('durationMinutes', 0)
        dctMovie['urlPoster'] = dctMain.get('mainCoverImage', '').replace(urlOceanBase, '')
        dctMovie['urlFdb'] = sUrl
        dctMovie['sCountry'] = ' / '.join(dctMain.get('countries', []))
        dctMovie['sGenre'] = ' / '.join([v.get('name','') for v in dctMain.get('genres', [])])
        dctMovie['sTitle_EN'] = dctMain.get('englishTitle', '') or dctMain.get('originalTitle', '')
        dctMovie['sStory'] = dctDescr.get('description', '')
        dctMovie['sCopyright'] = ', '.join([g.get('name') for g in dct.get('distributors', [])])
        
        dt = dctMain.get('releaseDate', '')
        if dt:
            dt = datetime.fromisoformat(dt)
            dctMovie['sReleaseDate'] = f"{dt.day}.{dt.month}.{dt.year}" 
        else:
            dctMovie['sReleaseDate'] = ''
        
        dctMovie['sTags'] = ', '.join([v.get('name','') for v in dctMain.get('tags', [])])
        dctMovie['sSeries'] = ''
        dctMovie['sEpisodes'] = ''
        
        
        dct = dctMain.get('directors', None)
        if type(dct) is dict:
            dctMovie['sDirector'] = ', '.join([v['fullName'] for k, v in dct.items()])
        elif type(dct) is list:
            dctMovie['sDirector'] = ', '.join([v['fullName'] for v in dct])
        else:
            dctMovie['sDirector'] = ''
        
        dct = dctMain.get('actors', None)
        if type(dct) is dict:
            dctMovie['sActor'] = ', '.join([v['fullName'] for k, v in dct.items()])
        elif type(dct) is list:
            dctMovie['sActor'] = ', '.join([v['fullName'] for v in dct])
        else:
            dctMovie['sActor'] = ''
        
        if sAuthor:
            dctMovie['sAuthor'] = sAuthor
        elif iCsfdIndex>=0:
            dctMovie['sAuthor'] = lxdCsfd[iCsfdIndex].get('sAuthor', '')
            
        # lstAuthor = sAuthor.split(',') if sAuthor else []
        # dctMovie['bNobel'] = any(fNormalize(author, True) in lstNormNobelNames for author in lstAuthor)
        dctMovie['bNobel'] = fNormalize(sAuthor, True) in lstNormNobelNames
        dctMovie['sNominated'] = lxdCsfd[iCsfdIndex].get('sNominated') if iCsfdIndex>=0 else ''
        dctMovie['sAwarded'] = lxdCsfd[iCsfdIndex].get('sAwarded') if iCsfdIndex>=0 else ''
        
        dctMovie['sFromAge'] = dctMain.get('ageRatings')[0] if dctMain.get('ageRatings') else ''
        dctMovie['sFromAge'] = dctMovie['sFromAge'].replace('from', '')+'+' if dctMovie['sFromAge'] else ''
        dctMovie['sFromAge'] = dctMovie['sFromAge'].replace('unrestricted+', '0+')
        dctMovie['sImdbId'] = dctMain.get('imdbUrl', '').replace(urlImdbBase, "") if dctMain.get('imdbUrl') else ''
        dctMovie['urlJustWatch'] = dctMain.get('justWatchUrl', '').replace(urlJustWatchBase, "") if dctMain.get('justWatchUrl') else ''
        dctMovie['bCzDabing'] = dctMain.get('czechDubbing', False)
        dctMovie['bCzSubtitles'] = dctMain.get('czechSubtitles', False)
        sSearchTitle = fSearchTitle(dctMovie)
        dctMovie['urlSledujteto'] = fExtractFromSledujteto(sNormTitle, sSearchTitle)
        dctMovie['urlPrehrajto'] = fExtractFromPrehrajto(sNormTitle, sSearchTitle)
        
        if 'česko' in dctMovie['sCountry'].lower() or 'slovensko' in dctMovie['sCountry'].lower():
            dctMovie['urlFilmMista'] = fExtractFromFilmMista(sNormTitle, fNormalize(dctMovie['sTitle'], False))
        else:
            dctMovie['urlFilmMista'] = ''
        
        lxdDetails.append(dctMovie)
        fSaveLxdToCsv(lxdDetails, sFileDetails)
        pass
    



# fGetMovieChart()
fGetMoviesDetails()

def fGetTopFilmLinks(sUrl):
    
    # r = requests.get(sUrl, headers=headers)
    # soup = BeautifulSoup(r.text, "html.parser")
    soup = fGetSoup(sUrl)
    
    links = []

    for a in soup.select('a[href^="/film/"][href$="/prehled/"]'):
        url = urlBase + a["href"]
        if url not in links:
            links.append(url)

    return links







links = fExtractFromSledujteto('', iCount=3)





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
lxdChart = fReadCsv(sFilmMoviesCsv)
fGetNewMovies(lxdChart)

print("Loading ranking page...")
lstAllFilmLinks = []
# for i in range(800, 1000, 100):
#     print("Loading ranking page from", i, "...")
#     lstAllFilmLinks.extend(fGetTopFilmLinks(i))



print("Films found:", len(lstAllFilmLinks))

lxd = []

