const btnSearch = document.getElementById('btnSearch');
const userInput = document.getElementById('userInput');
const statusBox = document.getElementById('statusBox');
const countrySelect = document.getElementById('countrySelect');
const genreSelect = document.getElementById('genreSelect');
const personSelect = document.getElementById('personSelect');
const awardSelect = document.getElementById('awardSelect');
const sModel = 'OpenAI|gpt-5.4-nano';

const sBaseUrl = "https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/";
  
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

const sMoviePrefix = `Zpracuj následující dotaz jako filmový expert. Zjisti, zda se dotaz týká osoby známé ve filmu.
  Nebo zda se jedná o téma filmu, zemi původu, žánr, charakteristika (černobílý, animovaný..) nebo období vydání filmu. 
  Země původu může být uvedena přídavným jménem. V tom případě odpověz názvem země.
  Odpověz pouze ve formě JSON pole, kde jednotlivé klíče budou: 
  herec, režisér, hudebník, žánr, země_původu, kontinent, charakteristika, téma, rok_od, rok_do, ocenění. 
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
      document.getElementById("logo").style.display = "none";
      
      fSearchMovies();
    }
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
  const sortButtons = fCreateSortButtons(); 
  document.getElementById('searchBtns').appendChild(sortButtons);
  

  
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
      if (s.includes(fNormalize(w)) && !s.includes('_')) {
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

async function fSearchMovies(sPrompt = userInput.value.trim()) {
  // let sPrompt = userInput.value.trim();
  
  if (!sPrompt) {
    statusBox.textContent = "Nebylo zadáno žádné hledání.";
    return;
  }

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
  if ((sPromptUnaccent).includes(" film")) {
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
  // hraný, animovaný, černobílý
  if ((sPromptUnaccent).includes(" barevn")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("barevn", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return !dctMovie.sTags.includes('černobílý')  
    })}
  if ((sPromptUnaccent).includes(" detektivka")) {
    sPromptUnaccent = sPromptUnaccent.toLowerCase().replace("detektivka", "");
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
  if ((sPromptUnaccent).includes(" hran")) {
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
    fCreateCards(lxdFound, 0, sMStype);
}

function fCreateCards(lxdFound, iId = 0, sMStype = null) {
  
  iShowId = iId ;
  if (iShowId < 0) iShowId = lxdFound.length - 1;
  if (iShowId >= lxdFound.length) iShowId = 0;
  // if (sOrderCol == 'random') {
  //   lxdFound = fShuf fle(lxdFound);
  // }

  fCreateServiceLinkButtons(linksBox, lxdFound[iShowId])

  switch (sMStype) {
    case 'm':
      sFS = 'film';
      break;
    case 's':
      sFS = 'seriál';
      break;
    default:
      sFS = 'film/seriál';
    }
  sFS2 = sFS.replaceAll('y','ů');

  cardsWrap.innerHTML = "";  
  const iMaxToShow = 1
  if (lxdFound.length === 0) {
    statusBox.textContent = `Nebyl nalezen žádný ${sFS}. Zkuste se zeptat jinak.`;
    return;
  } else if (lxdFound.length <= iMaxToShow) {
    // statusBox.textContent = `Nalezeno ${lxdFound.length} ${sFS2}.`;
    statusBox.textContent = `Zobrazuji ${sFS} ${iShowId+1} z ${lxdFound.length} nalezených.`;
    lxdFound.forEach(dctMovie => {
      cardsWrap.appendChild(fCreateMovieCard(dctMovie))})
    } else {
    //statusBox.textContent = `Nalezeno ${lxdFound.length} ${sFS2}. Zobrazuje se prvních ${iMaxToShow} výsledků.`;
    statusBox.textContent = `Zobrazuji ${sFS} ${iShowId+1} z ${lxdFound.length} nalezených.`;
    // lxdFound.slice(0, iMaxToShow).forEach(dctMovie => {
    //   cardsWrap.appendChild(fCreateMovieCard(dctMovie))
    cardsWrap.appendChild(fCreateMovieCard(lxdFound[iShowId]));
    // }
 
  }
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
  


async function fAsk_smaz(sPrefix, sPrompt = userInput.value.trim()) {

  // const prompt = document.getElementById("q").value;
  //alert(prompt);
  // localStorage.setItem('sPrompt', userInput.value.trim());

  
  statusBox.textContent = "Čekám na odpověď od " + sModel.split('|')[0] + " ...";

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
    return '[{"Error": "' + r.status + ' ' + r.statusText + '"}]';
  }
  const data = await r.json();
  //alert('after json');
  return data;

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

  if (userInput.value.trim()) {
    fSearchMovies();
  } else {
    fRandomMovies();
  }

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
  const sPoster = dctMovie.urlPoster || "";
  const sTitle = dctMovie.sTitle || "";
  const sCountry = dctMovie.sCountry || "";
  const sGenre = dctMovie.sGenre || "";
  const iYear = dctMovie.iYear || "";
  const sDirector = dctMovie.sDirector || "";
  const sAuthor = dctMovie.sAuthor || "";
  const sActor = dctMovie.sActor || "";
  const sAwarded = dctMovie.sAwarded.replaceAll('<br>', '\n') || "";
  const sStory = dctMovie.sStory || "";
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
  `;

  const colStory = document.createElement("div");
  colStory.className = "col-story";
  colStory.innerHTML = `<p class="story-text">${fEsc(sStory.slice(0,1200))}</p>`;

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
  linksBox.innerHTML = "";
  // placeholder links; later you can generate your own
  let sMovieQuery = 
    dctMovie.sCountry.includes("Česko") || dctMovie.sCountry.includes("Slovensko") ? 
        encodeURIComponent(dctMovie.sTitle + " " + dctMovie.iYear) :
        encodeURIComponent(dctMovie.sTitle + " dabing " + dctMovie.iYear);
  const sTitleEnc = encodeURIComponent(dctMovie.sTitle);
  const sTitleEnEnc = encodeURIComponent(dctMovie.sTitle_EN);
  let ulrFilmLocations = 
    dctMovie.sCountry.includes("Česko") || dctMovie.sCountry.includes("Slovensko") ? 
      `https://www.filmovamista.cz/vyhledavani?q=${sTitleEnc}&submint=Hledat` : 
      `https://www.reelstreets.com/?s=${sTitleEnEnc}`;
  
  const lstLinks = [
    { sName: "SledujteTo.cz", sUrl: `https://www.sledujteto.cz/vyhledat/?search=${sMovieQuery}&page=1` },
    { sName: "YouTube", sUrl: "https://www.youtube.com/results?search_query=" + sMovieQuery },
    { sName: "ČSFD", sUrl: dctMovie.urlCsfd },
    { sName: "Film. místa", sUrl: ulrFilmLocations },
  ];

  const dctPlatforms= {
    "netflix.com": "Netflix",
    "ceskatelevize.cz/porady": "iVysilani",
    "iprima.cz": "iPrima",
    "voyo.cz": "Voyo",
    "primevideo.com": "Amazon",
    "hbomax.com": "HBO",
    "tv.apple.com": "Apple",
    "disneyplus.com": "Disney+",
    "skyshowtime.com": "SkyShowtime",
    "canalplus.com": "Canal+",
    "lepší.tv": "lepší.tv",}

  lstMoviePlatforms = dctMovie.sPlatforms.split("<br>")

  Object.keys(dctPlatforms).forEach(domain => {
    bFound = false
    lstMoviePlatforms.forEach(p => { 
      if (p.toLowerCase().includes(domain) && !bFound) {
        lstLinks.push({ sName: dctPlatforms[domain], sUrl: p.trim() });
        bFound = true;
      }
    });
  });


  lstLinks.forEach(dctLink => {
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
  div.className = "d-flex align-items-start gap-2 mb-3";
  
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

  // --- EVENTS ---
  btnDown.onclick = () => fCreateCards(lxdFound, iShowId + 1);
  btnUp.onclick = () => fCreateCards(lxdFound, iShowId - 1);
  // btnUp.onclick = () => fScrollPrev();
  // btnDown.onclick = () => fScrollNext();

  // --- APPEND ---
  container.appendChild(btnDown);
  container.appendChild(btnUp);
  
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