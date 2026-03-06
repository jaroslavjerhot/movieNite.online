document.addEventListener('DOMContentLoaded', async () => {
    //alert('dom loaded');
    const sServicesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/services.csv'
    const sCountriesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/countries.csv'
    const sGenresUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/genres.csv'
    const sMoviesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/movies.csv'
    // const sServicesUrl = '/data/services.csv'
    const lxdServices = await fLoadServices(sServicesUrl);
    const lxdCountries = await fLoadServices(sCountriesUrl);
    const lxdGenres = await fLoadServices(sGenresUrl);
    let  lxdMovies = await fLoadServices(sMoviesUrl);

    const dctCountryRegion = {};
    lxdCountries.forEach(r => {
        dctCountryRegion[r.sCountry] = r.sRegion;
    });
    
    const dctGenreGroup = {};
    lxdGenres.forEach(r => {
        dctGenreGroup[r.sGenre] = r.sGenreGroup;
    });

    lxdMovies = lxdMovies.map(movie => {
    return {
        ...movie,
        sRegions: fGrouping(movie.sCountry, dctCountryRegion),
        sGenreGroup: fGrouping(movie.sGenre, dctGenreGroup),
        sYearGroup: fGroupingYears(movie.iYear),        
    }
    });
    const cntServices = renderButtons(lxdServices,64);
    x = 1;
});

document.addEventListener("keydown", e =>
{
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
        return "<" + sBottomLevel.slice(0, 3) + "0's";
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