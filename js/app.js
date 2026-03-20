const askBtn = document.getElementById('askBtn');
const userInput = document.getElementById('userInput');
const modelSelect = document.getElementById('modelSelect');
const answerBox = document.getElementById('answerBox');
const priceEl = document.getElementById('price');

const sGooglePrefix = `Zpracuj následující dotaz jako expert na vyhledávání informací na internetu. 
  Zjisti zda se dotaz týká vyhledávání článku, obrázku, obrázku k tisku, videa, podcastu, ppt nebo pdf. 
  Zjisti, které země a jazyka se dotaz týká.
  Zjisti, zda je hledání vhodné omezit pouze na určité webové stránky nebo jejich části.
  Jazyk by měl odpovídat zemi.
  Odpověz pouze ve formě JSON pole, kde jednotlivé klíče budou 
  dotaz, země, jazyk, datum_od, datum_do, file_type, site, inurl.
  Jazyk uveď ve ISO 639-1, zemi ve formátu ISO 3166-1 alpha-2, datum ve formátu YYYY-MM-DD.
  \n\nDotaz: `

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

  const csv = await fLoadCsv(sOpenAIpricing)
  lxdOpenAI = fCsvToLxd(csv);

  lxdOpenAI = lxdOpenAI.filter(dRow => Number(dRow.iTotal) <= 2);
  lxdOpenAI.forEach(dRow => {
    sTotalCZK = (Number(dRow.iTotal) * 21 * 1.21).toFixed(0);
    dRow.sModelName = "OpenAI | " + dRow.sModel + " (" + sTotalCZK + " Kč/1Mt)";
    dRow.sModel = "OpenAI|" + dRow.sModel
  });
  lxdOpenAI.forEach(dRow => {
        const oOption = document.createElement("option");
        oOption.value = dRow.sModel;
        if (dRow.sModel === localStorage.getItem('model')) oOption.selected = true;
        oOption.textContent = dRow.sModelName;
        modelSelect.appendChild(oOption);
  });


  askBtn.addEventListener('click', () => fAsk(sMoviePrefix));
  userInput.textContent = localStorage.getItem('prompt') || "";
  // document.getElementById('keyDebug').textContent = lstDevice.join(", ") + ": " + navigator.userAgent;
  

});

  async function fAsk(sPrefix) {

  // const prompt = document.getElementById("q").value;
  //alert(prompt);
  localStorage.setItem('prompt', userInput.value.trim());
  localStorage.setItem('model', modelSelect.value);
  
  answerBox.textContent = "Čekám na odpověď...";

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

  
  //alert(JSON.stringify(data));
  if ("iPromptTokens" in data) {
    dctModel = lxdOpenAI.find(dRow => dRow.sModel === modelSelect.value);
    iPriceUSD = (data.iPromptTokens * dctModel.iInput + data.iCompletionTokens * dctModel.iOutput)/1000000;
    data.iPriceHalsDPH = (iPriceUSD * 100 * 21 * 1.21).toFixed(3);
  } else {
    data.iPriceHalsDPH = '--';
    data.iElapsedMs = '--';
  }

answerBox.textContent = data.sAnswer
priceEl.textContent = data.iPriceHalsDPH + ' hal / ' + (data.iElapsedMs/1000).toFixed(3) + ' s';


x=0
  
}