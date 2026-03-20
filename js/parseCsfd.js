const links = [...document.querySelectorAll("a")]
  .map(a => a.href)
  .filter(href => href.match(/^https:\/\/www\.csfd\.cz\/film\/.+\/prehled\/$/));

console.log(links);