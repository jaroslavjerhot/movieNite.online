document.addEventListener('DOMContentLoaded', () => {
    fLoadServices();
});

async function fLoadServices() {
    // const sServicesUrl = 'https://jaroslavjerhot.github.io/movieNite.online/data/services.csv';
    // const sServicesUrl = 'https://raw.githubusercontent.com/jaroslavjerhot/movieNite.online/main/data/services.csv'
    const sServicesUrl = '/data/services.csv'
    const response = await fetch(sServicesUrl);
    const text = await response.text();

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

    const encoded = encodeURIComponent(query);
    const finalUrl = urlTemplate.replace('#w', encoded);

    window.open(finalUrl, '_blank');
}