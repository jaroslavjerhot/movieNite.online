let lxdServices = [];
let lxdTypes = [];
let lxdCountries = [];
let lxdGenres = [];
let lxdAwards = [];

let lxdMovies = [];
let allMovies = [];

let filteredMovies = [];
let filterHistory = [];

let dctActiveFilters = {
    sTypeGroup: null,
    sRegion: null,
    sGenreGroup: null,
    sYearGroup: null,
    sAwardGroup: null
};
dctActiveFilters  = (JSON.parse(localStorage.getItem('activeFilters')) || dctActiveFilters);

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


    fGrouping("sType", "sTypeGroup", dctTypeGroup);
    fGrouping("sCountry", "sRegion", dctCountryRegion);
    fGrouping("sGenre", "sGenreGroup", dctGenreGroup);  
    fGrouping("sAward", "sAwardGroup", dctAwardGroup);
    lxdMovies.forEach(movie => {
        movie.sYearGroup = fGroupingYears(movie.iYear);
    });

    // lxdMovies = lxdMovies.map(movie => {
    // return {
    //     ...movie,
    //     sTypeGroup: fGrouping(movie.sType, dctTypeGroup),
    //     sRegions: fGrouping(movie.sCountry, dctCountryRegion),
    //     sGenreGroup: fGrouping(movie.sGenre, dctGenreGroup),
    //     sYearGroup: fGroupingYears(movie.iYear),        
    //     sAwardGroup: fGrouping(movie.sAward, dctAwardGroup),        
    // }
    // });
    // Store original movies
    allMovies = [...lxdMovies];
    filteredMovies = [...allMovies];
    filterHistory = [];

    // const cntServices = renderButtons(lxdServices,64);
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

function fGrouping2(sColumn, sValue, dctGrouping) {
    return [...new Set(
        sValue.split("/")
            .map(c => c.trim())
            .map(c => (c in dctGrouping ? dctGrouping[c] : c))
            .filter(Boolean)
    )].join(" / ");
}

function fGrouping(sSrcCol, sTrgCol, dctGrouping) {
    lxdMovies.forEach(movie => {
        lst = movie[sSrcCol].split("/").map(c => c.trim()).map(c => (c in dctGrouping ? dctGrouping[c] : c)).filter(Boolean);
        movie[sTrgCol] = [...new Set(lst)].join(" / ");
        x = 1;
    });
}

function fGroupingYears(sYear, sBottomLevel='1949') {
    if (sYear>sBottomLevel) {
        return sYear.slice(0, 3) + "0s";
    } else {
        return sBottomLevel;
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
    //window.open(query, '_blank');
    // location.href = query;

    const a = document.createElement("a");
    a.href = query;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.target = "_blank";
    a.click();

    a.remove();
    }



// --- Get unique values for filters ---
function fGetUnique(array, field, sFirstValue='All') {
    const lst = [...new Set(array.map(x => x[field]))].sort().filter(Boolean)
    return [sFirstValue, ...lst];
}
function fCreateBtn(text, sFilterCol, btnWidth, btnType) {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.innerHTML = text.replaceAll(' ','&nbsp;');
    btn.tabIndex = 0;
    btn.name = sFilterCol;
    btn.style.width = btnWidth + "%";
    btn.onclick = () => applyFilter(btn, sFilterCol, btnType);
    return btn;
}

// --- Render filter buttons ---
function renderFilterButtons() {
    const typeFilters = document.getElementById("typeFilters");
    const regionFilters = document.getElementById("regionFilters");
    const genreFilters = document.getElementById("genreFilters");
    const yearFilters = document.getElementById("yearFilters");
    const awardFilters = document.getElementById("awardFilters");

    const types = fGetUnique(lxdTypes, "sTypeGroup", "Všechno");
    const regions = fGetUnique(lxdCountries, "sRegion", "Všech.země");
    const genres = fGetUnique(lxdGenres, "sGenreGroup", "Všech.žánry");
    const years = fGetUnique(lxdMovies, "sYearGroup", "Všech.roky");
    years[1] = 'do ' + years[1];
    const awards = fGetUnique(lxdAwards, "sAwardGroup", "I bez cen");

    const btnMax = Math.max(types.length, regions.length, genres.length, years.length, awards.length);
    const btnWidth = 90 / btnMax; // -2 for margin

    typeFilters.innerHTML = "";
    regionFilters.innerHTML = "";
    genreFilters.innerHTML = "";
    yearFilters.innerHTML = "";
    awardFilters.innerHTML = "";
    // genres.forEach(g => genreFilters.innerHTML = "");
    // years.forEach(y => yearFilters.innerHTML = "");

    types.forEach(r => {
        let btn = fCreateBtn(r, "sTypeGroup", btnWidth, r);
        typeFilters.appendChild(btn);
    });
    
    regions.forEach(r => {
        let btn = fCreateBtn(r, "sRegion", btnWidth, r);
        regionFilters.appendChild(btn);
    });
    
    genres.forEach(g => {
        let btn = fCreateBtn(g, "sGenreGroup", btnWidth, g);
        genreFilters.appendChild(btn);
    });

    years.forEach(y => {
        let btn = fCreateBtn(y, "sYearGroup", btnWidth, y);
        yearFilters.appendChild(btn);
    });
    
    awards.forEach(a => {
        let btn = fCreateBtn(a, "sAwardGroup", btnWidth, a);
        awardFilters.appendChild(btn);
    });
}

// --- Apply a filter ---
function applyFilter(btn, field, value) {
    
    bIsActive = btn.classList.contains("active");
    document.getElementsByName(field).forEach(el => el.classList.remove("active"));
    if (bIsActive) {
        document.getElementsByName(field)[0].classList.add("active"); // set "All" active when toggling off
        value = dctActiveFilters[field] = document.getElementsByName(field)[0].innerText; // set filter to "All" when toggling off
    } else {
        btn.classList.add("active");
    }
    
    dctActiveFilters  = (JSON.parse(localStorage.getItem('activeFilters')) || dctActiveFilters);
    dctActiveFilters[field] = value;
    filterHistory.push([...filteredMovies]); // save previous state
    filteredMovies = allMovies;
    for (const [field, value] of Object.entries(dctActiveFilters)) {
        if (value && value !== "Všechno" && value !== "Všech.země" && value !== "Všech.žánry" && value !== "Všech.roky" && value !== "I bez cen") {
            filteredMovies = filteredMovies.filter(m => 
                m[field].includes(value));
       }
    }
    localStorage.setItem('activeFilters', JSON.stringify(dctActiveFilters));
    sDescr = 'Typ: ' + dctActiveFilters.sTypeGroup + '; Region: ' + dctActiveFilters.sRegion + '; Žánr: ' + dctActiveFilters.sGenreGroup + '; Rok: ' + dctActiveFilters.sYearGroup + '; Ocenění: ' + dctActiveFilters.sAwardGroup + '; Celkem: ' + filteredMovies.length;
    sDescr = sDescr.replaceAll('null', 'cokoli')
    document.getElementById('descr').innerText = sDescr;
    renderMovies();
    
}

function fInitialRender() {
    dctActiveFilters  = (JSON.parse(localStorage.getItem('activeFilters')) || dctActiveFilters);
    
    Object.entries(dctActiveFilters).forEach(([field, value]) =>  {
        if (!value) {
            document.getElementsByName(field)[0].classList.add("active")
            dctActiveFilters[field] = document.getElementsByName(field)[0].innerText
        } else {
            value = value.replaceAll('&nbsp;', ' ');
            document.getElementsByName(field).forEach(el => {
                if (el.innerHTML === value) {
                    el.classList.add("active");
                }
            });
        }});
    filteredMovies = allMovies;
    for (const [field, value] of Object.entries(dctActiveFilters)) {
        if (value && value !== "Všechno" && value !== "Všech.země" && value !== "Všech.žánry" && value !== "Všech.roky" && value !== "I bez cen") {
            filteredMovies = filteredMovies.filter(m => 
                m[field].includes(value));
       }
    }
    sDescr = 'Typ: ' + dctActiveFilters.sTypeGroup + '; Region: ' + dctActiveFilters.sRegion + '; Žánr: ' + dctActiveFilters.sGenreGroup + '; Rok: ' + dctActiveFilters.sYearGroup + '; Ocenění: ' + dctActiveFilters.sAwardGroup + '; Celkem: ' + filteredMovies.length;
    sDescr = sDescr.replaceAll('null', 'cokoli')
    document.getElementById('descr').innerText = sDescr;
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
    const container = document.getElementById("moviesTableBody");
    container.innerHTML = "";

    filteredMovies.slice(0,25).forEach(movie => {
        const row = document.createElement("tr");
        row.className = "movie-row";

        // Movie details
        ["sMovie","svc-st","svc-cf","iYear","sCountry","sGenre","sDirector","sActors","sAward"].forEach(field=>{
            const td = document.createElement("td");
            if (field.includes('svc-')) {
                // Search buttons (like in your previous section)
                const service = lxdServices.find(x => x.sId === field.split('-')[1]);

                const domain = new URL(service.sSearchUrl).hostname;
                // const iconUrl = `https://www.google.com/s2/favicons?sz=32&domain=${domain}`;
                const btn = document.createElement("button");
                btn.tabIndex = 0;
                btn.className = "filter-btn";
                btn.style.backgroundColor = "#B90000";
                // btn.style.width = "16px";
                // btn.style.height = "16px";
                // btn.innerHTML = `<img src="${iconUrl}" alt="${service.sName}">`;
                btn.innerHTML = `${service.sName}`;
                // btn.innerHTML = "▶";
                let sQuery = movie.sMovie + ' ' + movie.iYear;
                sQuery += movie.sRegion != "Cz|Sk" ? " dabing": ""
                btn.onclick = () => fOpenSearch(service.sSearchUrl, sQuery);
                    
                    td.appendChild(btn);
                
            } else {
                td.innerText = movie[field];
            }

            row.appendChild(td);});

        
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
    fInitialRender();
}

