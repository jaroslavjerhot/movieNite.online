function fGetFocusableElements() {
  const sSelector = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled]):not([type='hidden'])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(", ");

  return [...document.querySelectorAll(sSelector)]
    .filter(el => {
      const oStyle = window.getComputedStyle(el);
      return oStyle.display !== "none" && oStyle.visibility !== "hidden";
    });
}

function fSetCaretToEnd(oEl) {
  if (oEl.tagName === "INPUT" || oEl.tagName === "TEXTAREA") {
    const iLen = oEl.value.length;
    oEl.focus();
    oEl.setSelectionRange(iLen, iLen);
  } else {
    oEl.focus();
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
    // alert('key: ' + event.key + '\ncode: ' + event.code )  
    return;
  }

  const oActive = document.activeElement;
  const loFocusable = fGetFocusableElements();
  const iIndex = loFocusable.indexOf(oActive);

  if (iIndex === -1) return;

  event.preventDefault();

  let iNextIndex;

  if (event.key === "ArrowDown") {
    iNextIndex = iIndex + 1 < loFocusable.length ? iIndex + 1 : 0;
  } else {
    iNextIndex = iIndex - 1 >= 0 ? iIndex - 1 : loFocusable.length - 1;
  }

  fSetCaretToEnd(loFocusable[iNextIndex]);
});

// const oKeyDebug = document.getElementById("keyDebug");

let iPrevEventX = 0;
let iPrevEventY = 0;
const oDebugBox = document.getElementById("keyDebug");

function fLog(sType, event) {
  const iEventX = event.clientX ?? 0;
  const iEventY = event.clientY ?? 0;
  sDir = "";
  if (iEventX > iPrevEventX) sDir='right'
  else if (iEventX < iPrevEventX) sDir='left'
  else if (iEventY < iPrevEventY) sDir='up'
  else if (iEventY > iPrevEventY) sDir='down'
  iPrevEventX = iEventX;
  iPrevEventY = iEventY;

  const sMsg =
    "type=" + sType +
    " | key=" + (event.key ?? "") +
    " | code=" + (event.code ?? "") +
    " | keyCode=" + (event.keyCode ?? "") +
    " | which=" + (event.which ?? "") +
    " | button=" + (event.button ?? "") +
    " | buttons=" + (event.buttons ?? "") +
    " | x=" + iEventX.toFixed(2) +
    " | y=" + iEventY.toFixed(2) +
    " | direction=" + sDir +
    " | target=" + ((event.target && (event.target.id || event.target.tagName)) ?? "");

  oDebugBox.textContent = sMsg;
  
}

[
  "keydown",
  "keyup",
  "keypress",
  "click",
  "dblclick",
  "mousedown",
  "mouseup",
  "pointerdown",
  "pointerup",
  "pointermove",
  "mousemove",
  "touchstart",
  "touchend",
  "focusin",
  "focusout",
  "contextmenu",
  "wheel",
  "scroll",
  "change",
  "input",
].forEach(sEventType => {
  document.addEventListener(sEventType, event => fLog(sEventType, event), true);
});

document.addEventListener("wheel", event => fLog("wheel", event), true);
document.addEventListener("contextmenu", event => fLog("contextmenu", event), true);

// if (lstDevice.includes("Mi-Box")){
//     document.addEventListener("dblclick", function(event) {
//         event.preventDefault();
//         const el = document.activeElement;
//         if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
//         el.value = ""}})
//     // long click
//     document.addEventListener("keypress", function(event) {
//         if (event.code === 13) { // Enter key
//             askBtn.classList.add("active");
//             askBtn.click();
//             setTimeout(() => askBtn.classList.remove("active"), 150);
//     }});
// }
