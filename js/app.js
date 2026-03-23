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

  btnSearch.addEventListener('click', () => {
    document.getElementById("logo").style.display = "none";
    fSearchMovies();
  });
  btnRandom.addEventListener('click', () => {
    document.getElementById("logo").style.display = "none";
    fRandomMovies();
  });
  const gMailBtn = document.getElementById('gMailBtn');
  gMailBtn.addEventListener('click', () => {
    window.open('https://mail.google.com/mail/u/0/#inbox', '_blank'); 

    // Add your Gmail button functionality here
  });

  userInput.textContent = localStorage.getItem('sPrompt') || "";
  
});

function fNormalize(s, bRemoveSpaces = true) {
  let result = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replaceAll('y','i')
    .replaceAll('  ',' ');
  if (bRemoveSpaces) {
    result = result.replaceAll(' ','');
  }
  return result;
}

function fCutEnding(lstPrompt) {
  for (const ending in dctEndings) {
    lstPrompt = lstPrompt.map(s => {
      if (s.endsWith(ending)) {
        return s.slice(0, -ending.length) + dctEndings[ending];
      }
      return s;
    });
  }
  return lstPrompt;
}

function fAdjectiveToCountry(lstPrompt) {
  return lstPrompt.map(s => {
    if (dctCountryAdjectives[s]) {
      return dctCountryAdjectives[s];
    }
  return s;
  });



async function fSearchMovies(sPrompt = userInput.value.trim()) {
  // let sPrompt = userInput.value.trim();
  const iWords = sPrompt.split(" ").length;
  localStorage.setItem('sPrompt', sPrompt);
  let lstPrompt = sPrompt.split(" ").map(s => s.trim()).filter(s => s.length > 1);
  lstPrompt = fCutEnding(lstPrompt);
  lstPrompt = fAdjectiveToCountry(lstPrompt);
  
  if (!sPrompt) {
    // alert("Please enter a search query.");
    statusBox.textContent = "Nebylo zadáno žádné hledání.";
    return;
  }
  
  let lxdFound = lxdMovies;

  if (iWords > 2) {    
    let sPromptUnaccent = fNormalize(sPrompt);
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sTitleUnaccent.includes(sPromptUnaccent)})
     fCreateCards(lxdFound)
     return;}

  // series/movies
  if ((' ' + sPrompt.toLowerCase()).includes(" film")) {
    sPrompt = sPrompt.toLowerCase().replace("film", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sType === 'm' 
    })}
  if ((' ' + sPrompt.toLowerCase()).includes(" seriál")) {
    sPrompt = sPrompt.toLowerCase().replace("seriál", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return dctMovie.sType === 's' 
    })}
  // hraný, animovaný, černobílý
  if ((' ' + sPrompt.toLowerCase()).includes(" barevný")) {
    sPrompt = sPrompt.toLowerCase().replace("barevný", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return !dctMovie.sTags.includes('černobílý') 
    })}
  if ((' ' + sPrompt.toLowerCase()).includes(" hraný")) {
    sPrompt = sPrompt.toLowerCase().replace("hraný", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return !dctMovie.sGenres.includes('animovaný') && !dctMovie.sGenres.includes('loutkový') 
    })}
  // Slovensko - ne Československo
  if ((' ' + sPrompt).toLowerCase().includes(" slovensk")) {
    sPrompt = sPrompt.toLowerCase().replace("slovensko", "").replace("slovenský", "");
    lxdFound = lxdFound.filter(dctMovie => {
      return !dctMovie.sCountry.includes('Česko') 
    })}
    // nahradi zkratky a nazvy zemi
    //let lstPrompt = sPrompt.split(" ")
    let bNominationOnly = false;
    lstPrompt = sPrompt.split(" ").map(s => s.trim()).filter(s => s.length > 1 &&
      !['na', 'pod', 'nad', 'před', 'po', 'od', 've', 'ke', 'se'].includes(s.toLowerCase()));
    lstPrompt.forEach((w, i) =>   {
      if (w.includes('americk')) lstPrompt[i] = 'USA';
      if (w.includes('britsk')) lstPrompt[i] = 'Velká Británie';
      if (w.includes('anglick')) lstPrompt[i] = 'Velká Británie';
      if (w.includes('francouz')) lstPrompt[i] = 'Francie';
      if (w.slice(-3) === 'ící') lstPrompt[i] = '';
      if (lstPrompt[i].length>4){
        lstPrompt[i] = ' ' + fNormalize(lstPrompt[i].slice(0, -1));
      } else {
        lstPrompt[i] = ' ' + fNormalize(lstPrompt[i]);
      }
      if (w.includes('nomino')) bNominationOnly = true;
      
    })
    lxdFound = lxdFound.filter(dctMovie => {
      const sNorm = fNormalize(' ' + dctMovie.sCountry + ' ' + dctMovie.sGenre + ' ' + dctMovie.sContinent + ' ' + dctMovie.sNominated + 
          ' ' + dctMovie.sStory + ' ' + dctMovie.sTags  + ' ' + dctMovie.sDirector + ' ' + dctMovie.sActor + 
          ' ' + dctMovie.sAuthor, false)
      return lstPrompt.every((w => sNorm.includes(w.toLowerCase()))

    )})

    fCreateCards(lxdFound);
    
  // first try to find movies that include the at least two-word prompt anywhere in the title
  // if (iWords == 1) {
  //   let sPromptUnaccent = fNormalize(sPrompt);
  //   lxdFound = lxdFound.filter(dctMovie => {
  //     return dctMovie.sTitleUnaccent.includes(sPromptUnaccent) ||
  //       fNormalize(
  //         dctMovie.sStory + dctMovie.sTags  + dctMovie.sDirector + dctMovie.sActor + 
  //         dctMovie.sAuthor, false).includes(sPromptUnaccent)
  //   })}
  // else if (iWords == 2) {
  //   const sWord1 = fNormalize(sPrompt.split(" ")[0]);
  //   const sWord2 = fNormalize(sPrompt.split(" ")[1]);
  //   lxdFound = lxdFound.filter(dctMovie => {
  //       const sNorm = fNormalize(
  //         dctMovie.sTitle + dctMovie.sStory + dctMovie.sTags  + dctMovie.sDirector + 
  //         dctMovie.sActor + dctMovie.sAuthor, false);
  //       return (sNorm.includes(sWord1 + ' ' + sWord2) || sNorm.includes(sWord2 + ' ' + sWord1))
  //   })}  
  // else{
  //   let sPromptUnaccent = fNormalize(sPrompt);
  //   lxdFound = lxdFound.filter(dctMovie => {
  //     return dctMovie.sTitleUnaccent.includes(sPromptUnaccent)
  //   })}
  
    // if nothing found or too many results, 
  // if (lxdFound.length === 0 || lxdFound.length > 1) {
  //   const jsonReturn = await fAsk(sMoviePrefix);
  //   dctAnswer = JSON.parse(jsonReturn.sAnswer)[0];
  //   return;
  // }
  


}

function fCreateCards(lxdFound, sOrderCol = 'random', bAscending = true ) {
  
  if (sOrderCol == 'random') {
    lxdFound = fShuffle(lxdFound);
  }

  cardsWrap.innerHTML = "";  
  const iMaxToShow = 20;
  if (lxdFound.length === 0) {
    // alert("No movies found for: " + sPrompt);
    statusBox.textContent = "Nebyly nalezeny žádné filmy/seriály. Zkuste se zeptat jinak.";
    return;
  } else if (lxdFound.length < iMaxToShow) {
    statusBox.textContent = "Nalezeno " + lxdFound.length + " filmů/seriálů.";
    lxdFound.forEach(dctMovie => {
      cardsWrap.appendChild(fCreateMovieCard(dctMovie))})
    } else {
    statusBox.textContent = `Nalezeno ${lxdFound.length} filmů/seriálů. Zobrazuje se prvních ${iMaxToShow} výsledků.`;
    cardsWrap.innerHTML = "";
    lxdFound.slice(0, iMaxToShow).forEach(dctMovie => {
      cardsWrap.appendChild(fCreateMovieCard(dctMovie))
    });
  }
}

function fProcessAIresponse(lxdFound, sPrompt, jsonReturn) {
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
  


async function fAsk(sPrefix, sPrompt = userInput.value.trim()) {

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
  
  let csvCountries= await fLoadCsv('country-continent.csv');
  lxdCountries = fCsvToLxd(csvCountries);
  dctCountryAdjectives = {};
  lxdCountries.forEach(dct => {
    if (dct.sAdjective) dctCountryAdjectives[dct.sAdjectiv] = dct.sCountry;
  })
  
  let csvEndings= await fLoadCsv('endings.csv');
  lxdEndings = fCsvToLxd(csvEndings);
  dctEndings = {};
  lxdEndings.forEach(dct => {
    if (dct.sEnding) dctEndings[dct.sEnding] = dct.sReplace;
  })
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
  } else if (dctMovie.sType ==='s' && dctMovie.sSeries===0) {
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
  const iRuntime = dctMovie.iRuntime || 0;

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

  posterWrap.appendChild(rating);
  
  posterWrap.appendChild(img);

  const colMeta = document.createElement("div");
  colMeta.className = "col-meta";
  colMeta.innerHTML = `
    ${fMetaLine("", sMovieSeries)}
    <h2 class="movie-title">${fEsc(sTitle)}</h2>
    ${fMetaLine("Země:", sCountry)}
    ${fMetaLine("Žánr:", sGenre)}
    ${fMetaLine("Rok:", iYear)}
    ${fMetaLine("Konec:", `za ${iRuntime} min. ve ${fGetEndTime(iRuntime)}`)}
    ${fMetaLine("Režisér:", sDirector)}
    ${fMetaLine("Autor:", sAuthor)}
    ${fMetaLine("Herec:", sActor)}
    ${fMetaLine("Ocenění:", sAwarded)}
  `;

  const colStory = document.createElement("div");
  colStory.className = "col-story";
  colStory.innerHTML = `<p class="story-text">${fEsc(sStory.slice(0,800))}</p>`;

  // const colLinks = document.createElement("div");
  // colLinks.className = "col-links";

  const linksBox = document.createElement("div");
  linksBox.className = "links-box";

  // placeholder links; later you can generate your own
  let sMovieQuery = 
    dctMovie.sCountry.includes("Česko") || dctMovie.sCountry.includes("Slovensko") ? 
        encodeURIComponent(dctMovie.sTitle + " " + iYear) :
        encodeURIComponent(dctMovie.sTitle + " dabing " + iYear);
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
    "ceskatelevize.cz": "iVysilani",
    "iprima.cz": "iPrima",
    "voyo.cz": "Voyo",
    "netflix.com": "Netflix",
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

  // colLinks.appendChild(linksBox);
  colMeta.appendChild(linksBox);

  card.appendChild(posterWrap);
  card.appendChild(colMeta);
  card.appendChild(colStory);
  //card.appendChild(colLinks);

  return card;
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