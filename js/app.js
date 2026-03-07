let lxdServices = [];
let lxdCountries = [];
let lxdGenres = [];
let lxdMovies = [];
let allMovies = [];
let filteredMovies = [];
let filterHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
    //alert('dom loaded');
    const sServicesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/services.csv'
    const sCountriesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/countries.csv'
    const sGenresUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/genres.csv'
    const sAwardsUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/awards.csv'
    const sTypesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/types.csv'
    const sMoviesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/movies.csv'
    // const sServicesUrl = '/data/services.csv'
    lxdServices = await fLoadServices(sServicesUrl);
    lxdCountries = await fLoadServices(sCountriesUrl);
    lxdGenres = await fLoadServices(sGenresUrl);
    lxdAwards = await fLoadServices(sAwardsUrl);
    lxdTypes = await fLoadServices(sTypesUrl);
    lxdMovies = await fLoadServices(sMoviesUrl);

    const dctCountryRegion = {};
    lxdCountries.forEach(r => {
        dctCountryRegion[r.sCountry] = r.sRegion;
    });    
    const dctGenreGroup = {};
    lxdGenres.forEach(r => {
        dctGenreGroup[r.sGenre] = r.sGenreGroup;
    });
    const dctAwardGroup = {};
    lxdAwards.forEach(r => {
        dctAwardGroup[r.sAward] = r.sAwardGroup;
    });
    const dctTypeGroup = {};
    lxdTypes.forEach(r => {
        dctTypeGroup[r.sType] = r.sTypeGroup;
    });
    
    lxdMovies = lxdMovies.map(movie => {
    return {
        ...movie,
        sTypeGroup: fGrouping(movie.sType, dctTypeGroup),
        sRegions: fGrouping(movie.sCountry, dctCountryRegion),
        sGenreGroup: fGrouping(movie.sGenre, dctGenreGroup),
        sYearGroup: fGroupingYears(movie.iYear),        
        sAwardGroup: fGrouping(movie.sAward, dctAwardGroup),        
    }
    });
    // Store original movies
    allMovies = [...lxdMovies];
    filteredMovies = [...allMovies];
    filterHistory = [];

    const cntServices = renderButtons(lxdServices,64);
    initMoviesSection();
    x = 1;
});

document.addEventListener("keydown", e =>
{
    return
    const buttons = [...document.querySelectorAll(".serviceBtn")]

    if (buttons.length === 0) return

    const currentIndex = buttons.indexOf(document.activeElement)

    if (e.key === "ArrowRight")
    {
        const next = buttons[currentIndex + 1] || buttons[0]
        next.focus()
    }

    if (e.key === "ArrowLeft")
    {
        const prev = buttons[currentIndex - 1] || buttons[buttons.length - 1]
        prev.focus()
    }

    if (e.key === "ArrowUp")
    {
        document.getElementById("searchBox").focus()
    }

})

function fGrouping(sValue, dctGrouping) {
    return [...new Set(
        sValue.split("/")
            .map(c => c.trim())
            .map(c => (c in dctGrouping ? dctGrouping[c] : c))
            .filter(Boolean)
    )].join(" / ");
}

function fGroupingYears(sYear, sBottomLevel='1949') {
    if (sYear>sBottomLevel) {
        return sYear.slice(0, 3) + "0s";
    } else {
        // return sBottomLevel.slice(0, 3) + "0s -";
        return 'do ' + sBottomLevel;
        
    }
}

async function fLoadServices(sServicesUrl) {
    const response = await fetch(sServicesUrl);
    //alert('loaded')
    const text = await response.text();
    const rows = text.trim().split('\n');
    const headers = rows.shift().split(';');

    const lxd = rows.map(row => {
        const values = row.split(';');
        let obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        if (obj.bUse === '1' || !('bUse' in obj)) 
            return obj;
    }).filter(Boolean);
    return lxd;
    //fRenderServices(services);
}


function renderButtons(services, iSize=64)
{
    const container = document.getElementById("services")
    container.innerHTML = ""
    const iSizeRounded = fRoundToLst(iSize)
    const queryRaw = document.getElementById("searchBox").value.trim()

    // if (!queryRaw) return

    //const query = removeAccents(queryRaw)

    services.forEach(service =>
    {
        const btn = document.createElement("button")
        btn.className = "serviceBtn"

        const domain = new URL(service.sSearchUrl).hostname

        // const iconUrl =
        // `https://www.google.com/s2/favicons?sz=${iSizeRounded}&domain=${domain}`
        const iconUrl =
        `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
        

        btn.innerHTML = `<div class="serviceName">${service.sName}</div>`
        btn.innerHTML = `<img src="${iconUrl}">`
        btn.innerHTML = `<img src="https://i.ibb.co/CW5Wvry/buttonpng.png"><div class="serviceName">${service.sName}</div>`
        btn.innerHTML = `<img src="${iconUrl}" alt="${service.sName}">`

        btn.style.width = iSize + "px"
        btn.style.height = iSize + "px"
        btn.style.fontSize = (iSize/5) + "px"
        btn.style.padding = (iSize/10) + "px"
        btn.style.backgroundSize = (iSize*0.8) + "px " + (iSize*0.8) + "px"
        btn.style.borderRadius = (iSize/2) + "px"   
     
        
        btn.onclick = () => fOpenSearch(service.sSearchUrl)

        container.appendChild(btn)
    })
    return container
}

function fRoundToLst(iValue, lstValues=[16,32,64,128,256]) {
    if (lstValues.includes(iValue)) return iValue;
    let closest = lstValues[0];
    let minDiff = Math.abs(iValue - closest);
    lstValues.forEach(val => {
        const diff = Math.abs(iValue - val);
        if (diff < minDiff) {
            closest = val;
            minDiff = diff;
        }
    });
    return closest;
}

function fOpenSearch(urlTemplate, sSearchedValue='') {

    let query = sSearchedValue || document.getElementById('searchBox').value.trim();
    if (!query) return;
    query = query
        .replaceAll('  ', ' ')
        .trim()
        .normalize('NFD')                // separate accent from letter
        .replace(/[\u0300-\u036f]/g, ''); // remove accents
    
    if (urlTemplate.includes('#m')) {
        query = urlTemplate.replace('#m', query.replace(/ /g, '-'));
    } else if (urlTemplate.includes('#p')) {
        query = urlTemplate.replace('#p', query.replace(/ /g, '+'));
    }
    // finalUrl = finalUrl.replace('%20', '+');
    // window.open(finalUrl, '_blank');
    location.href = finalUrl;
}



// --- Get unique values for filters ---
function getUnique(array, field) {
    const lst = [...new Set(array.map(x => x[field]))].sort().filter(Boolean)
    return ['All', ...lst];
}

// --- Render filter buttons ---
function renderFilterButtons() {
    const regionFilters = document.getElementById("regionFilters");
    const genreFilters = document.getElementById("genreFilters");
    const yearFilters = document.getElementById("yearFilters");

    const regions = getUnique(lxdCountries, "sRegion");
    regions[0] = "Všech.země"; // Ensure "All" is first
    const genres = getUnique(lxdGenres, "sGenreGroup");
    genres[0] = "Všech.žánry"; // Ensure "All" is first
    const years = getUnique(lxdMovies, "sYearGroup");
    years[0] = "Všech.roky"; // Ensure "All" is first

    const btnMax = Math.max(regions.length, genres.length, years.length);
    const btnWidth = 90 / btnMax; // -2 for margin

    regionFilters.innerHTML = "";
    genres.forEach(g => genreFilters.innerHTML = "");
    years.forEach(y => yearFilters.innerHTML = "");

    regions.forEach(r => {
        let btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.innerText = r;
        btn.style.width = btnWidth + "%";
        btn.tabIndex = 0;
        btn.onclick = () => applyFilter("sRegion", r);
        regionFilters.appendChild(btn);
    });

    genres.forEach(g => {
        let btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.innerText = g;
        btn.tabIndex = 0;
        btn.style.width = btnWidth + "%";
        btn.onclick = () => applyFilter("sGenreGroup", g);
        genreFilters.appendChild(btn);
    });

    years.forEach(y => {
        let btn = document.createElement("button");
        btn.className = "filter-btn";
        btn.innerText = y;
        btn.tabIndex = 0;
        btn.style.width = btnWidth + "%";
        btn.onclick = () => applyFilter("sYearGroup", y);
        yearFilters.appendChild(btn);
    });
}

// --- Apply a filter ---
function applyFilter(field, value) {
    filterHistory.push([...filteredMovies]); // save previous state
    filteredMovies = filteredMovies.filter(m => m[field] === value);
    renderMovies();
}

// --- Go back to previous filter ---
function returnPreviousFilter() {
    if (filterHistory.length > 0) {
        filteredMovies = filterHistory.pop();
        renderMovies();
    }
}

// --- Render movie list ---
function renderMovies() {
    const container = document.getElementById("movieList");
    container.innerHTML = "";

    filteredMovies.slice(0,25).forEach(movie => {
        const row = document.createElement("div");
        row.className = "movie-row";

        // Movie details
        ["sMovie","iYear","sCountry","sGenre","sDirector","sActors","sAward"].forEach(field=>{
            const div = document.createElement("div");
            div.innerText = movie[field];
            row.appendChild(div);
        });

        // Search buttons (like in your previous section)
        // lxdServices.forEach(service=>{
        //     const domain = new URL(service.sSearchUrl).hostname;
        //     const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
        //     const btn = document.createElement("button");
        //     btn.tabIndex = 0;
        //     btn.innerHTML = `<img src="${iconUrl}" alt="${service.sName}">`;
        //     btn.onclick = ()=>{
        //         const query = encodeURIComponent(movie.sMovie);
        //         const url = service.sSearchUrl.replace("#w", query);
        //         window.open(url, "_blank");
        //     };
        //     row.appendChild(btn);
        // });

        container.appendChild(row);
    });
}

// --- Keyboard navigation: return previous filter ---
document.addEventListener("keydown", e=>{
    if (e.key === "Backspace" || e.key === "Escape") {
        returnPreviousFilter();
    }
});

// --- Initialize ---
function initMoviesSection() {
    renderFilterButtons();
    renderMovies();
}

