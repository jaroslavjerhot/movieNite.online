document.addEventListener('DOMContentLoaded', () => {
    fLoadServices();const form = document.getElementById('searchForm');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        fOpenDefaultService();
    });
});

const input = document.getElementById('searchInput');
const dummy = document.getElementById('dummyFocus');

input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        dummy.focus();   // move focus away
    }
});

input.addEventListener('input', function() {
    setTimeout(() => {
        if (document.activeElement === input) {
            dummy.focus();
        }
    }, 1000);
});

async function fLoadServices() {
    // alert('here')
    // const sServicesUrl = 'https://jaroslavjerhot.github.io/movieNite.online/data/services.csv';
    const sServicesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/services.csv'
    // const sServicesUrl = '/data/services.csv'
    const response = await fetch(sServicesUrl);
    const text = await response.text();
    // alert('loaded')
    const rows = text.trim().split('\n');
    const headers = rows.shift().split(';');

    const services = rows.map(row => {
        const values = row.split(';');
        let obj = {};
        headers.forEach((h, i) => obj[h] = values[i]);
        return obj;
    });

    fRenderServices(services);
}

function fRenderServices(services) {

    const container = document.getElementById('servicesContainer');
    container.innerHTML = '';

    services.forEach(service => {

        const div = document.createElement('div');
        div.className = 'service';

        const favicon = `https://www.google.com/s2/favicons?sz=128&domain=${new URL(service.sSearchUrl).hostname}`;

        div.innerHTML = `
            <img src="${favicon}">
            <span>${service.sName}</span>
        `;

        div.addEventListener('click', () => {
            fOpenSearch(service.sSearchUrl);
        });

        container.appendChild(div);
    });
}

function fOpenSearch(urlTemplate) {

    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;

    const encodedPlus = encodeURIComponent(query.replace(/ /g, '+'));
    const encodedMinus = encodeURIComponent(query.replace(/ /g, '-'));
    let finalUrl = '';
    if (urlTemplate.includes('#m')) {
        finalUrl = urlTemplate.replace('#m', encodedMinus);
    } else {
        finalUrl = urlTemplate.replace('#w', encodedPlus);
    }

    // window.open(finalUrl, '_blank');
    location.href = finalUrl;
}