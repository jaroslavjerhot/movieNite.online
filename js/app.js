const btnSearch = document.getElementById('btnSearch');
const userInput = document.getElementById('userInput');
const statusBox = document.getElementById('statusBox');
const countrySelect = document.getElementById('countrySelect');
const genreSelect = document.getElementById('genreSelect');
const personSelect = document.getElementById('personSelect');
const awardSelect = document.getElementById('awardSelect');
const sModel = 'OpenAI|gpt-5.4.nano';
  

const sMoviePrefix = `Zpracuj následující dotaz jako filmový expert. Zjisti, zda se dotaz týká osoby známé ve filmu.
  Nebo zda se jedná o téma filmu, zemi původu, žánr, charakteristika (černobílý, animovaný..) nebo období vydání filmu. 
  Země původu může být uvedena přídavným jménem. V tom případě odpověz názvem země.
  Odpověz pouze ve formě JSON pole, kde 
  jednotlivé klíče budou herec, režisér, hudebník, žánr, země_původu, charakteristika,
  téma, rok_od, rok_do, ocenění. 
  \n\nDotaz: `
let lxdOpenAI = []

let lstDevice = [];
if (navigator.userAgent.includes("AppleTV")) lstDevice.push("Apple TV");
if (navigator.userAgent.includes("MIBOX")) lstDevice.push("Mi-Box");
if (navigator.userAgent.includes("Android")) lstDevice.push("Android");
if (navigator.userAgent.includes("Windows")) lstDevice.push("Windows");

document.addEventListener('DOMContentLoaded', async () => {

  btnSearch.addEventListener('click', () => fSearch());
  userInput.textContent = localStorage.getItem('sPrompt') || "";
  main()
  

});

  async function fAsk(sPrefix) {

  // const prompt = document.getElementById("q").value;
  //alert(prompt);
  localStorage.setItem('sPrompt', userInput.value.trim());

  
  statusBox.textContent = "Čekám na odpověď...";

  sPrefix = sPrefix.replaceAll(/[\u0000-\u001F]/g, "");
  sPrefix = sPrefix.replaceAll('   ',' ').replaceAll('  ',' ');
  
  dctBody = { prefix: sPrefix,
              prompt: userInput.value.trim(),
              service: modelSelect.value}  
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
    answerBox.textContent = 'Error: ' + r.status + ' ' + r.statusText;
    priceEl.textContent = '-- hal';
    return;
  }
  const data = await r.json();
  //alert('after json');

x=0
  
}

async function main() {
  let lxdMovies = await fLoadMovies();
  lxdMovies = lxdMovies.filter(fIsUsableMovie);

  const lxdRandom10 = fGetRandomItems(lxdMovies, 10);

  const cardsWrap = document.getElementById("cardsWrap");
  cardsWrap.innerHTML = "";

  lxdRandom10.forEach(dctMovie => {
    cardsWrap.appendChild(fCreateMovieCard(dctMovie));
  });
}

async function fLoadMovies() {
  const sMoviesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/movies_series.json'

  // sMoviesUrl = "data/movies_series.json"; 
  const response = await fetch(sMoviesUrl);
  if (!response.ok) {
    throw new Error("Cannot load " + sMoviesUrl);
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

  const sPoster = dctMovie.urlPoster || "";
  const sTitle = dctMovie.sTitle || "";
  const sCountry = dctMovie.sCountry || "";
  const sGenre = dctMovie.sGenre || "";
  const iYear = dctMovie.iYear || "";
  const sDirector = dctMovie.sDirector || "";
  const sAuthor = dctMovie.sAuthor || "";
  const sActor = dctMovie.sActor || "";
  const sAward = dctMovie.sAward || "";
  const sStory = dctMovie.sStory || "";

  const posterWrap = document.createElement("div");
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

  posterWrap.appendChild(img);

  const colMeta = document.createElement("div");
  colMeta.className = "col-meta";
  colMeta.innerHTML = `
    <h2 class="movie-title">${fEsc(sTitle)}</h2>
    ${fMetaLine("Country", sCountry)}
    ${fMetaLine("Genre", sGenre)}
    ${fMetaLine("Year", iYear)}
    ${fMetaLine("Director", sDirector)}
    ${fMetaLine("Author", sAuthor)}
    ${fMetaLine("Actor", sActor)}
    ${fMetaLine("Award", sAward)}
  `;

  const colStory = document.createElement("div");
  colStory.className = "col-story";
  colStory.innerHTML = `<p class="story-text">${fEsc(sStory)}</p>`;

  const colLinks = document.createElement("div");
  colLinks.className = "col-links";

  const linksBox = document.createElement("div");
  linksBox.className = "links-box";

  // placeholder links; later you can generate your own
  const sMovieQuery = encodeURIComponent(dctMovie.sTitle + " dabing " + iYear);
  // const urlCSFD = dctMovie.urlCsfd || `https://www.csfd.cz/hledat/?q=${sMovieQuery}`;
  const lstLinks = [
    { sName: "ČSFD", sUrl: dctMovie.urlCsfd },
    { sName: "Sledujte.to", sUrl: `https://www.sledujteto.cz/vyhledat/?search=${sMovieQuery}&page=1` },
    { sName: "YouTube", sUrl: "https://www.youtube.com/results?search_query=" + sMovieQuery }
  ];

  lstLinks.forEach(dctLink => {
    const a = document.createElement("a");
    a.className = "link-btn";
    a.href = dctLink.sUrl;
    a.textContent = dctLink.sName;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    linksBox.appendChild(a);
  });

  colLinks.appendChild(linksBox);

  card.appendChild(posterWrap);
  card.appendChild(colMeta);
  card.appendChild(colStory);
  card.appendChild(colLinks);

  return card;
}

function fMetaLine(sLabel, sValue) {
  if (!String(sValue || "").trim()) {
    return "";
  }

  return `
    <p class="meta-line">
      <span class="meta-label">${fEsc(sLabel)}:</span>
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