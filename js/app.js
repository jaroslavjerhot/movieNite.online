// const btnSearch = document.getElementById('btnSearch');
const userInput = document.getElementById('userInput');
const statusBox = document.getElementById('statusBox');
// const countrySelect = document.getElementById('countrySelect');
// const genreSelect = document.getElementById('genreSelect');
// const personSelect = document.getElementById('personSelect');
// const awardSelect = document.getElementById('awardSelect');
const sModel = 'OpenAI|gpt-5.4-nano';
let btnStatus = null;
let btnSaveToFav = null;
const favBtn = document.getElementById('favBtn');

const sBaseUrl = "https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/";
  
const urlFdbBase = "https://www.fdb.cz/film/"
const urlOceanBase = 'https://prod-fdb-storage.fra1.cdn.digitaloceanspaces.com/galleries/'
const urlImdbBase = "https://www.imdb.com/title/"
const urlJustWatchBase = "https://www.justwatch.com/cz/film/"
const urlFilmMistaBase = "https://www.filmovamista.cz"
const urlSledujtetoBase = "https://www.sledujteto.cz"
const urlPrehrajtoBase = "https://prehraj.to"
const urlCsfdBase = "https://www.csfd.cz/film/"
const urlCsfdEmptyImage = "https://static.pmgstatic.com/assets/images/050b5bad23b8eb0b4f88f971b8f6a168/empty-image.svg"
const urlPmgStaticBase = "https://image.pmgstatic.com/cache/resized/w420/files/images/film/posters/"    
const urlFdbEmptyImage = "https://prod-fdb-storage.fra1.cdn.digitaloceanspaces.com/placeholders/General.png"



let lxdMovies = [];
let lxdCountries = [];
let lxdEndings = [];
let dctEndings = {};
let dctCountryAdjectives = {};
let dctProverbs = {};  
let lxdFound = [];
let iShowId = 0;
let sMStype = null;
let linksBox = null;
let lxdLinks = [];

const sMoviePrefix0 = `Zpracuj následující dotaz jako filmový expert. Zjisti, zda se dotaz týká osoby známé ve filmu.
  Nebo zda se jedná o téma filmu, zemi původu, žánr, charakteristika (černobílý, animovaný..) nebo období vydání filmu. 
  Země původu může být uvedena přídavným jménem. V tom případě odpověz názvem země.
  Odpověz pouze ve formě JSON pole, kde jednotlivé klíče budou: 
  herec, režisér, hudebník, žánr, země_původu, kontinent, charakteristika, téma, rok_od, rok_do, ocenění. 
  Dotaz je: `
const sMoviePrefix = `Pracuj jako filmový expert. Na základě následujícícho dotazu seatav seznam 5 fimů.
  U každého stačí název a děj.
  Odpověz pouze ve formě JSON seznamu, kde jednotlivé klíče budou: title a story 
  Dotaz je: `
let lxdOpenAI = []

let lstDevice = [];
if (navigator.userAgent.includes("AppleTV")) lstDevice.push("Apple TV");
if (navigator.userAgent.includes("MIBOX")) lstDevice.push("Mi-Box");
if (navigator.userAgent.includes("Android")) lstDevice.push("Android");
if (navigator.userAgent.includes("Windows")) lstDevice.push("Windows");

document.addEventListener('DOMContentLoaded', async () => {

  userInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // document.getElementById("logo").style.display = "none";
      fSearchMovies();
    }
  });

  const searchBtn = document.getElementById('searchBtn');
  searchBtn.addEventListener('click', () => {
    // document.getElementById("logo").style.display = "none";
    fSearchMovies();
  });

  const gMailBtn = document.getElementById('gMailBtn');
  gMailBtn.addEventListener('click', () => {
    window.open('https://mail.google.com/mail/u/0/#inbox', '_blank'); 

    // Add your Gmail button functionality here
  });

  userInput.textContent = localStorage.getItem('sPrompt') || "";

  const scrollControls = fCreateScrollControls();
  document.getElementById('searchBtns').appendChild(scrollControls);
  linksBox = fCreateEmptyLinksBox();
  document.getElementById('searchBtns').appendChild(linksBox);
  // const sortButtons = fCreateSortButtons(); 
  // document.getElementById('searchBtns').appendChild(sortButtons);
  

  
});

function fNormalize(s, bRemoveSpaces = true) {
  let result = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll('ø', 'o')
    .toLowerCase()
    // .replaceAll('y','i')
    .replaceAll('  ',' ');
  if (bRemoveSpaces) {
    result = result.replaceAll(' ','');
  }
  return result;
}

function fCutEnding(lstPrompt) {
  for (const ending in dctEndings) {
    lstPrompt = lstPrompt.map(s => {
      let bCut = false;
      if (s.endsWith(ending) && !bCut && ending=='y') {
        s = s.slice(0, -ending.length) + dctEndings[ending];
        // if (!['a', 'e', 'i', 'o', 'u', 'y', 'á', 'é', 'í', 'ó', 'ů', 'ý'].includes(s.slice(-2,-1))
        //     && !['a', 'e', 'i', 'o', 'u', 'y', 'á', 'é', 'í', 'ó', 'ů', 'ý'].includes(s.slice(-1))) {
        //   s = s.slice(0, -2) + 'e' + s.slice(-1);
        // }
        bCut = true;
        return s;
      }
      return s;
    });
  }
  return lstPrompt;
}

function fCutEnding2(lstPrompt) {
  lstToCut = ['y', 'ý', 'í', 'á', 'é'];
  lstToCut.forEach(ending => {
    lstPrompt = lstPrompt.map(s => {
      let bCut = false; 
      if (s.endsWith(ending) && !bCut) {
        s = s.slice(0, -1);
        bCut = true;
        return s;
      }
      return s;
    });
  });

  for (const ending in dctEndings) {
    lstPrompt = lstPrompt.map(s => {
      let bCut = false;
      if (s.endsWith(ending) && !bCut && ending=='y') {
        s = s.slice(0, -ending.length) + dctEndings[ending];
        // if (!['a', 'e', 'i', 'o', 'u', 'y', 'á', 'é', 'í', 'ó', 'ů', 'ý'].includes(s.slice(-2,-1))
        //     && !['a', 'e', 'i', 'o', 'u', 'y', 'á', 'é', 'í', 'ó', 'ů', 'ý'].includes(s.slice(-1))) {
        //   s = s.slice(0, -2) + 'e' + s.slice(-1);
        // }
        bCut = true;
        return s;
      }
      return s;
    });
  }
  return lstPrompt;
}

function fAdjectiveToCountry(lstPrompt) {
  lstPrompt.forEach((s, i) => {
     Object.keys(dctCountryAdjectives).forEach(w => {
      if (fNormalize(s).startsWith(fNormalize(w)) && !s.includes('_')) {
        lstPrompt[i] = 'country:' + dctCountryAdjectives[w];
      }
    });
  });
  return lstPrompt;
}
function fRemoveProverbs(lstPrompt) {
  lstPrompt.forEach((s, i) => {
    if (Object.keys(dctProverbs).includes(s)) {
        lstPrompt[i] = '';
      }
    });
  return lstPrompt;

} 

function fGetYear(text) {
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

async function fSearchMovies(sPrompt = userInput.value.trim()) {
  // let sPrompt = userInput.value.trim();
  
  if (!sPrompt) {
    statusBox.textContent = "Nebylo zadáno žádné hledání.";
    return;
  }
  bFoundExact = false;
  lxdFound = lxdMovies;
  const iWords = sPrompt.split(" ").length;
  localStorage.setItem('sPrompt', sPrompt);
  // hleda se presny nazev filmu, pokud je prompt dvouslovny
  if (iWords > 2) {    
    let sPromptUnaccent = fNormalize(sPrompt);
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sTitleUnaccent.includes(sPromptUnaccent)})
    if (lxdFound.length > 0) {
      sLastSortKey = ''
      fSortBy('iRating'); 
      fCreateCards(lxdFound, 0)
      localStorage.setItem("lxdFound", JSON.stringify(lxdFound));
      if (lxdFound.length === 1) {bFoundExact = true}
      return;}
  }
  lxdFound = lxdMovies;
  // jinak se hledá podle jednotlivých slov
  
  sPrompt = sPrompt.toLowerCase()
    .replaceAll('český lev','cesky_lev')
    .replaceAll('cesky lev','cesky_lev')
    .replaceAll('zlatá palma','zlata_palma')
    .replaceAll('zlata palma','zlata_palma')
    .replaceAll('oskar','oscar')
    // .replaceAll('oscar','academy_awards')
    .replaceAll('zlaty globus','golden_globe')
    
    
  
  let lstPrompt = sPrompt.split(" ").map(s => s.trim()).filter(s => s.length > 0);
  
  lstPrompt = fAdjectiveToCountry(lstPrompt);
  lstPrompt = fCutEnding2(lstPrompt);
  lstPrompt = fRemoveProverbs(lstPrompt);
  lstPrompt = [...new Set(lstPrompt.filter(Boolean))];
  lstPrompt = lstPrompt.map(s => ' ' +  fNormalize(s, false) + ' ');

  sPromptUnaccent =  ' ' +lstPrompt.join('');
  
  // series/movies
  // if ((sPromptUnaccent).includes(" film")) {
  if (true) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("film", "");
    sMStype = 'm';
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sType === 'm' 
    })}
  if ((sPromptUnaccent).includes(" serial")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("serial", "");
    sMStype = 's';
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sType === 's' 
    })}
// rok
  iYear = fGetYear(sPrompt);
  iSpan=5
  sPromptUnaccent = sPromptUnaccent.replace(iYear, "");
  if (iYear) {
    lxdFound = lxdFound.filter(dctMovie => {
      return parseFloat(dctMovie.iYear) >= iYear - iSpan && parseFloat(dctMovie.iYear) <= iYear + iSpan;
    })}

  // hraný, animovaný, černobílý
  if ((sPromptUnaccent).includes(" barevn")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("barevn", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return !dctMovie.sTags.includes('černobílý')  
    })}
  if ((sPromptUnaccent).includes(" zahranicn")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("zahranicn", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return !dctMovie.sCountry.toLowerCase().includes('česko')  
    })}
  if ((sPromptUnaccent).includes(" detektivka")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("detektivka", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sGenre.toLowerCase().includes('krimi')  
    })}
  if ((sPromptUnaccent).includes(" kriminalk")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("kriminalk", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sGenre.toLowerCase().includes('krimi')  
    })}
  if ((sPromptUnaccent).includes(" scifi")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("scifi", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sGenre.toLowerCase().includes('sci-fi')  
    })}
  if ((sPromptUnaccent).includes(" kreslen")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("kreslen", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sGenre.toLowerCase().includes('animovaný')  
    })}
  // if ((sPromptUnaccent).includes(" hran")) {
  if (!(sPromptUnaccent.includes(" kreslen")) && !(sPromptUnaccent.includes(" loutkov")) && !(sPromptUnaccent.includes(" anim"))) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("hran", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return (!dctMovie.sGenre.toLowerCase().includes('animovan') && !dctMovie.sGenre.toLowerCase().includes('loutkov')) 
    })}

    lstPrompt = sPromptUnaccent.split(" ").map(s => s.trim()).filter(s => s.length > 2);
    lstPrompt = [...new Set(lstPrompt.map(s => s.replaceAll('_',' ')))];

  
    lxdFound = lxdFound.filter(dctMovie => {
      const sNorm = fNormalize(' country:' + dctMovie.sCountry + ' country:' + dctMovie.sContinent + 
          ' ' + dctMovie.sTitle + ' ' + dctMovie.sTitle_EN + ' ' + dctMovie.sGenre + 
          ' ' + dctMovie.sStory + ' ' + dctMovie.sTags  + ' ' + dctMovie.sDirector + ' ' + dctMovie.sActor + 
          ' ' + dctMovie.sAuthor + ' ' + dctMovie.sNominated + ' ' + dctMovie.sAwarded, false)
      if (dctMovie.sTitleUnaccent.includes('lovcihlav')) {
         x = 0;
      }
      return lstPrompt.every(w => sNorm.includes(w))})
  

  sLastSortKey = '';
  fSortBy('iRating');
  
  if (!bFoundExact) {
    sEncodedPrompt = encodeURIComponent(userInput.value.trim());
    lstPlatforms = [
      `https://www.ceskatelevize.cz/ivysilani/hledani/?keyword=${sEncodedPrompt}`,
      `https://www.netflix.com/search?q=${sEncodedPrompt}`,
      `https://www.disneyplus.com/cs-cz/search?q=${sEncodedPrompt}`,
      `https://www.hbo.com/search?q=${sEncodedPrompt}`,
      `https://www.primevideo.com/search/ref=atv_nb_sr?ie=UTF8&field-keywords=${sEncodedPrompt}`,
      `https://www.apple.com/cz/apple-tv-plus/${sEncodedPrompt}`,
    ]
    lxdFound.push({
      sTitle: fCapitalizeFirst(userInput.value.trim()),
      sCountry: "",
      iYear: "",
      sPlatforms: lstPlatforms.join('<br>'),
      iRating: 0,
      sStory : "",
      urlCsfd: `https://www.csfd.cz/hledat/?q=${sEncodedPrompt}`,
      urlPoster: "https://static.pmgstatic.com/assets/images/050b5bad23b8eb0b4f88f971b8f6a168/empty-image.svg",
      sSearchStatus: "Doplněno pro úplnost. V této databázi nebyl nalezen žádný film nebo seriál, který by odpovídal tomuto hledání. Můžete ho zkusit najít na filmových serverech.",
      sAwarded: ""});
  }
  localStorage.setItem("lxdFound", JSON.stringify(lxdFound));
  fCreateCards(lxdFound, 0, sMStype);
}

function fCapitalizeFirst(str) {
    if (!str) return str;
    return str[0].toUpperCase() + str.slice(1);
}

function fCreateCards(lxdFound, iId = 0, sMStype = null) {
  
  iShowId = iId ;
  localStorage.setItem('iShowId', iShowId);
  if (iShowId < 0) iShowId = lxdFound.length - 1;
  if (iShowId >= lxdFound.length) iShowId = 0;
  // if (sOrderCol == 'random') {
  //   lxdFound = fShuf fle(lxdFound);
  // }

  switch (sMStype) {
    case 'm':
      sFS = 'film';
      break;
    case 's':
      sFS = 'seriál';
      break;
    default:
      sFS = 'film / seriál';
    }
  sFS2 = sFS.replaceAll('y','ů');

  cardsWrap.innerHTML = "";  
  const iMaxToShow = 1
  if (lxdFound.length === 0) {
    statusBox.textContent = `Nebyl nalezen žádný ${sFS}. Zkuste se zeptat jinak.`;
    
    } else {
    if (btnStatus) btnStatus.textContent = `${iShowId+1}/${lxdFound.length}`;
    cardsWrap.appendChild(fCreateMovieCard(lxdFound[iShowId]));
    fCreateServiceLinkButtons(linksBox, lxdFound[iShowId])
    
    const sMovieId = lxdFound[iShowId] ? lxdFound[iShowId].idCsfd : null;
    lstIds = JSON.parse(localStorage.getItem("lstFavoriteIds")) || [];
    const index = lstIds.indexOf(sMovieId);
    btnSaveToFav.classList.toggle("active", index !== -1);

    // }
  
 
  }
}

function fSafeClick(url) {  
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.click();
  a.remove();
}

async function fSearchOnVideoServers(iShowId){
  let dct = lxdFound[iShowId];
  const lstServersOrder = [
    "YouTube",
    "SledujteTo.cz",
    "iVysilani",
    "Přehraj.to",
    "Netflix",

    // "Voyo",
    // "Amazon",
    // "HBO",
    // "Apple",
    // "Disney+",
    // "SkyShowtime",
    // "Canal+",
    // "lepší.tv",

    "iPrima",
    "WebShare",
    "FastShare",

  ]

  async function fSearchServers() {
    for (const server of lstServersOrder) {
      lstUrl = lxdLinks.filter (dctLink => dctLink.sName === server);  
      if (lstUrl.length > 0) {
        sUrl = lstUrl[0].sUrl;
        if (sUrl.includes('sledujteto.cz') || sUrl.includes('prehraj.to') || 
        sUrl.includes('webshare') || sUrl.includes('fastshare') || 
        sUrl.includes('youtube')) {
        dctBody = {prompt: sUrl, service: 'ParseUrl|' + fNormalize(lstUrl[0].sName)}  
        jsonBody = JSON.stringify(dctBody);
        x=0
        const r = await fetch(
          "https://openonce.pythonanywhere.com/ask",
          { method: "POST",
            headers: {"Content-Type": "application/json"},
            body: jsonBody,

          }
        );
        const data = await r.json();
        alert(JSON.stringify(data));
        return
      } else {
      fSafeClick(sUrl);
      return;}
}}}

await fSearchServers();

  
}

function fProcessAIresponse_smaz(lxdFound, sPrompt, jsonReturn) {
  if (!jsonReturn || !jsonReturn.sAnswer) {
    statusBox.textContent = "Odpověď od AI neobsahuje očekávaná data.";
    return false;
  }
  dctAnswer = JSON.parse(jsonReturn.sAnswer)[0];
  let lstPersons = [];
  let lstGenres = [];
  let lstCountries = [];
  let lstContinents = [];
  let lstAwards = [];
  let lstNominations = [];
  let iYearFrom = null;
  let iYearTo = null;

  for (const key in dctAnswer) {
    if (dctAnswer.hasOwnProperty(key)) {   // optional safety
      const value = dctAnswer[key];
      if (['null', 'undefined', '-', ''].includes(value)) {
        dctAnswer[key] = null;
      } else {
        if (['režisér', 'herec', 'hudebník'].includes(key)){
          lstPersons.push(dctAnswer[key]);
        }else if (key === 'žánr') {
          lstGenres.push(dctAnswer[key]);
        }else if (key === 'země_původu' && !sPrompt.toLowerCase().includes(dctAnswer[key].toLowerCase().slice(0,-3))){ 
          lstCountries.push(dctAnswer[key]);
        }else if (key === 'kontinent') {
          lstContinents.push(dctAnswer[key]);
        }else if (key === 'rok_od') {
            iYearFrom = parseInt(dctAnswer[key], 10);
        }else if (key === 'rok_do') {
            iYearTo = parseInt(dctAnswer[key], 10);
        }else if (key === 'ocenění' && sPrompt.toLowerCase().includes('nomin')){
          lstNominations.push(dctAnswer[key]);
        }else if (key === 'ocenění' && !sPrompt.toLowerCase().includes('nomin')){
          lstAwards.push(dctAnswer[key]);
        }
      }
    }
  }
  if (iYearFrom) lxdFound = lxdFound.filter(dctMovie => dctMovie.iYear >= iYearFrom);
  if (iYearTo) lxdFound = lxdFound.filter(dctMovie => dctMovie.iYear <= iYearTo);
  if (lstAwards.length > 0) lxdFound = lxdFound.filter(dctMovie => lstAwards.some(award => dctMovie.sAwarded.includes(award)));
  if (lstNominations.length > 0) lxdFound = lxdFound.filter(dctMovie => lstNominations.some(nomination => dctMovie.sAwarded.includes(nomination)));
  if (lstGenres.length > 0) lxdFound = lxdFound.filter(dctMovie => lstGenres.some(genre => dctMovie.sGenre.includes(genre)));
  if (lstCountries.length > 0) lxdFound = lxdFound.filter(dctMovie => lstCountries.some(country => dctMovie.sCountry.includes(country)));
  if (lstContinents.length > 0) lxdFound = lxdFound.filter(dctMovie => lstContinents.some(continent => dctMovie.sContinent.includes(continent)));
  if (lstPersons.length > 0) lxdFound = lxdFound.filter(dctMovie => lstPersons.some(person => dctMovie.sDirector.includes(person) || dctMovie.sActor.includes(person) || dctMovie.sAuthor.includes(person)));
  lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sTitleUnaccent.includes(sPromptUnaccent) ||
        fNormalize(
          dctMovie.sStory + dctMovie.sTags  + dctMovie.sDirector + dctMovie.sActor + 
          dctMovie.sAuthor, false).includes(sPromptUnaccent)
    })}
  


async function fAskAI() {
  sPrompt = userInput.value.trim()
  sPrefix = sMoviePrefix
  // const prompt = document.getElementById("q").value;
  //alert(prompt);
  // localStorage.setItem('sPrompt', userInput.value.trim());

  
  //statusBox.textContent = "Čekám na odpověď od " + sModel.split('|')[0] + " ...";
  userInput.value = "Čekám na odpověď ..." 
  sPrefix = sPrefix.replaceAll(/[\u0000-\u001F]/g, "");
  sPrefix = sPrefix.replaceAll('   ',' ').replaceAll('  ',' ');
  
  dctBody = { prefix: sPrefix,
              prompt: sPrompt,
              service: sModel}  
  jsonBody = JSON.stringify(dctBody);

  const r = await fetch(
    "https://openonce.pythonanywhere.com/ask",
    { method: "POST",
      headers: {"Content-Type": "application/json"},
      body: jsonBody,
    }
  );
  //alert('after fetch');
  
  // const data = await r.json();
  if (!r.ok) {
    // answerBox.textContent = 'Error: ' + r.status + ' ' + r.statusText;
    // priceEl.textContent = '-- hal';
    userInput.value = "Chyba: " + r.status + " " + r.statusText;
    //return '[{"Error": "' + r.status + ' ' + r.statusText + '"}]';
  }

  userInput.value = sPrompt
  const dct = await r.json();
  dctModel = {iInput: 0.2, iOutput: 1.25};
  iPriceUSD = (dct.iPromptTokens * dctModel.iInput + dct.iCompletionTokens * dctModel.iOutput)/1000000;
  dct.iPriceHalsDPH = (iPriceUSD * 100 * 21 * 1.21).toFixed(3);
  
  
  lxdFound = JSON.parse(dct.sAnswer);
  userInput.value = sPrompt + " (cena odpovědi cca " + dct.iPriceHalsDPH + " hal)";
  
  


  lxdFound.forEach(o => {
    sEncodedTitle = encodeURIComponent(o.title);
    lstPlatforms = [
      `https://www.ceskatelevize.cz/ivysilani/hledani/?keyword=${sEncodedTitle}`,
      `https://www.netflix.com/search?q=${sEncodedTitle}`,
      `https://www.disneyplus.com/cs-cz/search?q=${sEncodedTitle}`,
      `https://www.hbo.com/search?q=${sEncodedTitle}`,
      `https://www.primevideo.com/search/ref=atv_nb_sr?ie=UTF8&field-keywords=${sEncodedTitle}`,
      `https://www.apple.com/cz/apple-tv-plus/${sEncodedTitle}`,
    ]
    lstPlatforms = []

    o.sTitle = o.title; 
    o.sCountry = "";
    o.iYear = "";
    o.sPlatforms = lstPlatforms.join('<br>');
    o.iRuntime = "90";
    o.iRating = 0;
    o.sStory = o.story;
    o.urlCsfd = `https://www.csfd.cz/hledat/?q=${sEncodedTitle}`;
    o.urlPoster = "https://static.pmgstatic.com/assets/images/050b5bad23b8eb0b4f88f971b8f6a168/empty-image.svg";
    o.sSearchStatus = "Doplněno AI.";
    o.sAwarded = "";
    delete o.story;
    delete o.title;
  });
  // identifies by name if any of lxdFound is in lxdMovies
  lxdFound = lxdFound.map(o => {
    const match = lxdMovies.find(m => m.sTitle === o.sTitle);
    return match ? { ...o, ...match } : o;
  });

  //alert('after json');
  localStorage.setItem("lxdFound", JSON.stringify(lxdFound));
  fCreateCards(lxdFound, 0);
  // return lxdFound;

x=0
  
}

function fRandomMovies(iCount = 10) {
  const lxdRandom10 = fGetRandomItems(lxdMovies, iCount);

  const cardsWrap = document.getElementById("cardsWrap");
  cardsWrap.innerHTML = "";
  statusBox.textContent = "Náhodně vybráno " + lxdRandom10.length + " filmů/seriálů.";
  userInput.value = "";
  localStorage.removeItem('sPrompt');
  lxdRandom10.forEach(dctMovie => {
    cardsWrap.appendChild(fCreateMovieCard(dctMovie));
  });}


async function main() {
  // countries and continents
  let csvCountries= await fLoadCsv('country-continent.csv');
  lxdCountries = fCsvToLxd(csvCountries);
  dctCountryAdjectives = {};
  lxdCountries.forEach(dct => {
    if (dct.sAdjective) dctCountryAdjectives[dct.sAdjective] = dct.sCountry;
  })
  // endings
  let csvEndings= await fLoadCsv('endings.csv');
  lxdEndings = fCsvToLxd(csvEndings);
  dctEndings = {};
  lxdEndings.forEach(dct => {
    if (dct.sEnding) dctEndings[dct.sEnding] = dct.sReplace;
  })
// proverbs
  let csvProverbs= await fLoadCsv('proverbs.csv');
  let lxdProverbs = fCsvToLxd(csvProverbs);
  dctProverbs = {};
  lxdProverbs.forEach(dct => {
    if (dct.sProverb) dctProverbs[dct.sProverb] = '';
  });
  
  lxdMovies = await fLoadJson('movies_series.json');
  // lxdMovies = lxdMovies.filter(fIsUsableMovie);

  lxdFound = JSON.parse(localStorage.getItem("lxdFound")) || [];
  iShowId = Math.max(parseInt(localStorage.getItem("iShowId")) || 0, 0) ;
  if (lxdFound.length > 0) fCreateCards(lxdFound, iShowId);

  // if (lxdFound.length === 0) {
  //  if (userInput.value.trim()) {
  //    fSearchMovies();
  //  } else {
  //    fRandomMovies();
  //  }
  // }
}

async function fLoadJson(sFileName) {
  const sUrl = sBaseUrl + (sFileName || "movies_series.json");
  
  // sMoviesUrl = "data/movies_series.json"; 
  const response = await fetch(sUrl);
  if (!response.ok) {
    throw new Error("Cannot load " + sFileName);
  }
  return await response.json();
  
}

function fIsUsableMovie(dctMovie) {
  return (dctMovie.sTitle || "").trim() !== "";
}

function fGetRandomItems(lst, count) {
  const lstCopy = [...lst];

  for (let i = lstCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lstCopy[i], lstCopy[j]] = [lstCopy[j], lstCopy[i]];
  }

  return lstCopy.slice(0, count);
}

function fCreateMovieCard(dctMovie) {
  const card = document.createElement("div");
  card.className = "movie-card";

  let sMovieSeries = ''
  if (dctMovie.sType ==='m'){
    sMovieSeries = 'Film';
  } else if (dctMovie.sType ==='s' && dctMovie.sSeries>0) {
    sMovieSeries = `Seriál (${dctMovie.sSeries} série/í, ${dctMovie.sEpisodes} epizod)`;
  } else if (dctMovie.sType ==='s') {
    sMovieSeries = `Seriál (${dctMovie.sEpisodes} epizod)`;  
  };
  sMovieSeries = sMovieSeries.replaceAll('.0','')
  const sPoster = dctMovie.urlCsfdPoster ? 
    urlPmgStaticBase + dctMovie.urlCsfdPoster : 
    dctMovie.urlFdbPoster ? 
    urlOceanBase + dctMovie.urlFdbPoster :     urlCsfdEmptyImage;
  const sTitle = dctMovie.sTitle || "";
  const sCountry = dctMovie.sCountry || "";
  const sGenre = dctMovie.sGenre || "";
  const iYear = dctMovie.iYear || "";
  const sDirector = dctMovie.sDirector || "";
  const sAuthor = dctMovie.sAuthor || "";
  const sActor = dctMovie.sActor || "";
  const sSearchStatus = dctMovie.sSearchStatus || "";
  const sAwarded = dctMovie.sAwarded.replaceAll('<br>', '\n') || "";
  const sStory = '\n' + dctMovie.sStory || "";
  let iRuntime = dctMovie.iRuntime || 0;

  const posterWrap = document.createElement("div");
  const rating = document.createElement("div");
  rating.className = "rating";
  
  rating.textContent = dctMovie.iRating ? dctMovie.iRating.split(',')[0]/10 + '/10' : "";

  posterWrap.className = "poster-wrap";

  const img = document.createElement("img");
  img.className = "poster";
  img.src = sPoster || "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="450">
      <rect width="100%" height="100%" fill="#222"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#777" font-size="24">No image</text>
    </svg>
  `);
  img.alt = sTitle;
  // img.onclick = () => fScrollNext(card);

  const scrollBox = document.createElement("div");
  scrollBox.className = "links-box";
  const btnPrev = document.createElement("button");
      btnPrev.className = "scroll-btn";
      btnPrev.title = "Scroll up";
      btnPrev.innerHTML = `
      <svg viewBox="0 0 24 24" class="icon">
        <path d="M7 14l5-5 5 5" />
      </svg>`;
      // btnPrev.onclick = () => fScrollToNextCard(card, -1);
    btnPrev.onclick = () => fCreateCards(lxdFound, iShowId - 1);
  
      // scrollBox.appendChild(btnPrev);

  

  const btnNext = document.createElement("button");
    btnNext.className = "scroll-btn";
    btnNext.title = "Scroll down";
    btnNext.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon">
      <path d="M7 10l5 5 5-5" />
    </svg>`;
    // btnNext.onclick = () => fScrollToNextCard(card, 1);
    btnNext.onclick = () => fCreateCards(lxdFound, iShowId + 1);
  // scrollBox.appendChild(btnNext);

  

  posterWrap.appendChild(rating);
  posterWrap.appendChild(img);
  posterWrap.appendChild(scrollBox);
  

  sOdhadem = iRuntime ? "" : "odhadem ";
  iRuntime = iRuntime ? iRuntime : '60';
 

  const colMeta = document.createElement("div");
  colMeta.className = "col-meta";
  colMeta.innerHTML = `
    ${fMetaLine("", sMovieSeries)}
    <h2 class="movie-title">${fEsc(sTitle)}</h2>
    ${fMetaLine("Země:", sCountry)}
    ${fMetaLine("Žánr:", sGenre)}
    ${fMetaLine("Rok:", iYear)}
    ${fMetaLine("Konec:", `${sOdhadem}za ${iRuntime} min. ve ${fGetEndTime(iRuntime)}`.replace('.0',''))}
    ${fMetaLine("Režisér:", sDirector)}
    ${fMetaLine("Autor:", sAuthor)}
    ${fMetaLine("Herec:", sActor)}
    ${fMetaLine("Ocenění:", sAwarded)}
    ${fMetaLine("", sSearchStatus)}
  `;

  const colStory = document.createElement("div");
  colStory.className = "col-story";
  colStory.innerHTML = `<p class="story-text">${fEsc(sStory.slice(0,1500))}</p>`;

  // const colLinks = document.createElement("div");
  // colLinks.className = "col-links";

  // const linksBox = document.createElement("div");
  // linksBox.className = "links-box";

  // // colLinks.appendChild(linksBox);
  // colStory.appendChild(linksBox);

  card.appendChild(posterWrap);
  card.appendChild(colMeta);
  card.appendChild(colStory);
  //card.appendChild(colLinks);
  return card;
}

function fCreateServiceLinkButtons(linksBox, dctMovie) {
  linksBox.innerHTML = "&nbsp;&nbsp;";
  linksBox.innerHTML = "";
  // placeholder links; later you can generate your own
  let sFastShareQuery = 
    dctMovie.sCountry.includes("Česko") || dctMovie.sCountry.includes("Slovensko") ? 
        fNormalize(dctMovie.sTitle + " " + dctMovie.iYear, false).replaceAll(' ', '-') :
        fNormalize(dctMovie.sTitle + " dabing " + dctMovie.iYear, false).replaceAll(' ', '-');
  
  let sMovieQuery = 
    dctMovie.sCountry.includes("Česko") || dctMovie.sCountry.includes("Slovensko") ? 
        encodeURIComponent(dctMovie.sTitle + " " + dctMovie.iYear) :
        encodeURIComponent(dctMovie.sTitle + " dabing " + dctMovie.iYear);
  const sTitleEnc = encodeURIComponent(dctMovie.sTitle);
  const sTitleEnEnc = encodeURIComponent(dctMovie.sTitle_EN);
  let ulrFilmLocations = 
    dctMovie.sCountry === "" || 
    dctMovie.sCountry.includes("Česko") || 
    dctMovie.sCountry.includes("Slovensko") ? 
      `https://www.filmovamista.cz/vyhledavani?q=${sTitleEnc}&submint=Hledat` : 
      `https://www.reelstreets.com/?s=${sTitleEnEnc}`;
  
  let urlYT = `https://www.youtube.com/results?search_query=-trailer ${sMovieQuery}`;
  if (dctMovie.iRuntime > 60) {
    urlYT = urlYT + '&sp=EgIYAg%253D%253D';
  }
  lxdLinks = [];
  let lxdLinksBase = [
    { sName: "SledujteTo.cz", sUrl: `https://www.sledujteto.cz/vyhledat/?search=${sMovieQuery}&page=1` },
    // { sName: "Přehraj.to", sUrl: "https://prehraj.to/hledej/" + sMovieQuery },
    // { sName: "WebShare", sUrl: "https://webshare.cz/#/search?what=" + sMovieQuery },
    // { sName: "FastShare", sUrl: "https://fastshare.cloud/" + sFastShareQuery + "/s" },
    { sName: "YouTube", sUrl: urlYT },
    { sName: "JustWatch", sUrl: `https://www.justwatch.com/cz/vyhled%C3%A1n%C3%AD?q=${sMovieQuery}` },
    { sName: "ČSFD", sUrl: dctMovie.urlCsfd },
    { sName: "Film.místa", sUrl: ulrFilmLocations },
  ];

  const dctPlatforms= {
    //"netflix.com": "Netflix",
    // "ceskatelevize.cz/porady": "iVysilani",
    // "ceskatelevize.cz/ivysilani": "iVysilani",
    // "iprima.cz": "iPrima",
    // "voyo.cz": "Voyo",
    // "primevideo.com": "Amazon",
    // "hbomax.com": "HBO",
    // "tv.apple.com": "Apple",
    // "disneyplus.com": "Disney+",
    // "skyshowtime.com": "SkyShowtime",
    // "canalplus.com": "Canal+",
    // "lepší.tv": "lepší.tv",
    }

  lstMoviePlatforms = dctMovie.sPlatforms.split("<br>")

  Object.keys(dctPlatforms).forEach(domain => {
    bFound = false
    lstMoviePlatforms.forEach(p => { 
      if (p.toLowerCase().includes(domain) && !bFound) {
        lxdLinks.push({ sName: dctPlatforms[domain], sUrl: p.trim() });
        bFound = true;
      }
    });
  });

  lxdLinks.push(...lxdLinksBase);

  lxdLinks.forEach(dctLink => {
    const a = document.createElement("a");
    a.className = "link-btn";
    a.href = dctLink.sUrl;
    a.textContent = dctLink.sName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    linksBox.appendChild(a);
  });

  
  
}


function fMetaLine(sLabel, sValue) {
  if (!String(sValue || "").trim()) {
    return "";
  }

  return `
    <p class="meta-line">
      <span class="meta-label">${fEsc(sLabel)}</span>
      ${fEsc(String(sValue))}
    </p>
  `;
}

function fEsc(sValue) {
  return String(sValue)
    .replaceAll("&", "&amp;")
    .replaceAll("#", "&#35;")
    .replaceAll(":", "&#58;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

main().catch(err => {
  console.error(err);
  document.getElementById("cardsWrap").innerHTML = `
    <div class="movie-card">
      <div class="col-meta">
        <h2 class="movie-title">Data loading error</h2>
        <p class="meta-line">${fEsc(err.message)}</p>
      </div>
    </div>
  `;
});

function fGetEndTime(iRuntime) {
  if (iRuntime === 0) {
    return "--:--";
  }
  
  const now = new Date();

  // add minutes
  now.setMinutes(now.getMinutes() + parseInt(iRuntime, 10));

  // format HH:MM
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return `${hh}:${mm}`;
}

function fShuffle(lst) {
  const arr = [...lst]; // copy (don’t modify original)

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

function fScrollToNextCard(card, multiplier = 1) {
  const gap = parseInt(getComputedStyle(card.parentElement).gap) || 0;
  const height = card.offsetHeight + gap;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  if (height < maxScroll) {
  
    window.scrollBy({
      top: height * multiplier,
      behavior: "smooth"
  })};
}

const cardsWrap = document.getElementById("cardsWrap");

function fScrollNext() {
  const cards = [...document.querySelectorAll(".movie-card")];
  const scrollTop = cardsWrap.scrollTop;

  const next = cards.find(c => c.offsetTop > scrollTop + 500);
  if (next) {
    next.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function fScrollPrev() {
  const cards = [...document.querySelectorAll(".movie-card")];
  const scrollTop = cardsWrap.scrollTop;

  const prev = [...cards].reverse().find(c => c.offsetTop < scrollTop - 500);
  if (prev) {
    prev.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function fCreateEmptyLinksBox () {
  const div = document.createElement("div");
  // div.className = "links-box";
  div.className = "d-flex flex-wrap align-items-start gap-2 mb-3";
  
  return div;
}

function fCreateScrollControls() {
  const container = document.createElement("div");
  // container.className = "scroll-controls";
  container.className = "d-flex align-items-start gap-2 mb-3";
  

  // --- UP BUTTON ---
  const btnUp = document.createElement("button");
  btnUp.className = "scroll-btn";
  btnUp.title = "Scroll up";

  btnUp.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon">
      <path d="M7 14l5-5 5 5" />
    </svg>
  `;

  // --- DOWN BUTTON ---
  const btnDown = document.createElement("button");
  btnDown.className = "scroll-btn";
  btnDown.title = "Scroll down";

  btnDown.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon">
      <path d="M7 10l5 5 5-5" />
    </svg>
  `;

  // --- RIGHT BUTTON ---
  const btnRight = document.createElement("button");
  btnRight.className = "scroll-btn";
  btnRight.title = "Search in video servers";
  
  btnRight.innerHTML = `
    <svg viewBox="0 0 24 24" class="icon">
      <path d="M10 7l5 5-5 5" />
    </svg>
  `;

  // --- STATUS BUTTON ---
  btnStatus = document.createElement("button");
  btnStatus.className = "scroll-btn";
  btnStatus.title = "Show status";
  btnStatus.textContent = `${iShowId+1} / ${lxdFound.length}`;

  // ---- Save to Favorites Button ---
  btnSaveToFav = document.createElement("button");
  btnSaveToFav.className = "scroll-btn";
  btnSaveToFav.title = "Toggle favorite";
  const svgStar = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
  const svgHeart = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  btnSaveToFav.innerHTML = `  <svg viewBox="0 0 24 24" class="icon">
    <path d="${svgStar}" />
    </svg>`;
  

  // --- EVENTS ---
  btnDown.onclick = () => fCreateCards(lxdFound, iShowId + 1);
  btnUp.onclick = () => fCreateCards(lxdFound, iShowId - 1);
  btnRight.onclick = () => fSearchOnVideoServers(iShowId);
  
  
  btnSaveToFav.onclick = () => fToggleIdInLocalStorage(iShowId);
  // btnUp.onclick = () => fScrollPrev();
  // btnDown.onclick = () => fScrollNext();

  
  // --- APPEND ---
  container.appendChild(btnDown);
  container.appendChild(btnStatus);
  container.appendChild(btnUp);
  // container.appendChild(btnRight);
  container.appendChild(btnSaveToFav);
  
  return container;
}

function fCreateSortButtons() {
  const div = document.createElement("div");
  div.className = "d-flex align-items-start gap-2 mb-3";
  

  const fields = [
    { key: "iRating", label: "Rating" },
    { key: "iYear", label: "Rok" },
    { key: "iRuntime", label: "Délka" },
    { key: "sTitle", label: "Název" }
  ];

  fields.forEach(f => {
    const btn = document.createElement("button");
    btn.className = "link-btn";
    btn.textContent = f.label;

    btn.onclick = () => fSortBy(f.key);

    div.appendChild(btn);
  });

  //document.body.prepend(div); // or append where you want
  return div
}

let bSortAsc = true; // toggle direction
let sLastSortKey = "";

function fSortBy(key) {
  // toggle direction if same column
  if (sLastSortKey === key) {
    bSortAsc = !bSortAsc;
  } else if (['iRating', 'iYear'].includes(key)) {
    bSortAsc = false;
    sLastSortKey = key;
  } else if (['sTitle', 'iRuntime'].includes(key)) {
    bSortAsc = true;
    sLastSortKey = key;
  }


  lxdFound.sort((a, b) => {
    let v1 = a[key];
    let v2 = b[key];

    // handle numbers stored as strings
    if (key.startsWith("i")) {
      v1 = parseFloat(v1.replace(',','.')) || 0;
      v2 = parseFloat(v2.replace(',','.')) || 0;
    } else {
      v1 = (v1 || "").toString().toLowerCase();
      v2 = (v2 || "").toString().toLowerCase();
    }

    if (v1 < v2) return bSortAsc ? -1 : 1;
    if (v1 > v2) return bSortAsc ? 1 : -1;
    return 0;
  })
  
  // return(lxdFound); // your existing render function
  x=0
  // fCreateCards(lxdFound, '', bSortAsc);
}

function fToggleIdInLocalStorage(iShowId, sStorageKey = "lstFavoriteIds") {
  const sMovieId = lxdFound[iShowId] ? lxdFound[iShowId].idCsfd : null;
  if (!sMovieId) return;
  btnSaveToFav.classList.toggle("active");
  const lstIds = JSON.parse(localStorage.getItem(sStorageKey)) || [];
  const index = lstIds.indexOf(sMovieId);
  if (index === -1) {
    lstIds.push(sMovieId);
  } else {
    lstIds.splice(index, 1);
  }
  localStorage.setItem(sStorageKey, JSON.stringify(lstIds));
}

function fFilterFavorites() {
  const bWasActive = favBtn.classList.toggle("active");
  // favBtn.classList.toggle("active");
  const lstFavIds = JSON.parse(localStorage.getItem("lstFavoriteIds")) || [];
  if (bWasActive) {
    lxdFound = lxdMovies.filter(movie => lstFavIds.includes(movie.idCsfd));
    localStorage.setItem("lxdFound", JSON.stringify(lxdFound));
    bFoundExact = true;
    fCreateCards(lxdFound, 0);}
  else {
      fSearchMovies();
  }

}