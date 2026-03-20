const textarea = document.getElementById("userInput");
const micBtn = document.getElementById("micBtn");

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let bListening = false;
let iSilenceTimer = null;
let sFinalText = "";
let sLastTranscript = "";

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "cs-CZ";
  recognition.continuous = true;
  recognition.interimResults = true;

  function fResetSilenceTimer() {
    clearTimeout(iSilenceTimer);
    iSilenceTimer = setTimeout(() => {
      if (bListening) {
        recognition.stop();
      }
    }, 5000);
  }

  function fStartListening() {
    if (bListening) return;
    textarea.value = "";
    // sFinalText = textarea.value ? textarea.value + " " : "";
    sFinalText = "";
    sLastTranscript = "";

    recognition.start();
  }

  function fStopListening() {
    if (!bListening) return;
    clearTimeout(iSilenceTimer);
    recognition.stop();
  }

  micBtn.addEventListener("click", () => {
    if (bListening) {
      fStopListening();
    } else {
      fStartListening();
    }
  });

  recognition.onstart = () => {
    bListening = true;
    micBtn.classList.add("listening");
    textarea.classList.add("listening");
    fResetSilenceTimer();
  };

  recognition.onresult = (event) => {
    let sInterim = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const sTranscript = event.results[i][0].transcript;
      if (sTranscript.trim() === sLastTranscript) {
        continue;
      }
        
      sLastTranscript = sTranscript.trim();

      if (event.results[i].isFinal) {
        //alert('1: sFinalText: ' + sFinalText +'\nsTranscript: ' + sTranscript);
        if (!sFinalText.includes(sTranscript)) {
          // sFinalText += sTranscript + " ";
          sFinalText = sTranscript;
          
        }
      } else {
        if (!sInterim.includes(sTranscript)) {
          sInterim += sTranscript;
        }
        // alert('2: sInterim: ' + sInterim + '\nsTranscript: ' + sTranscript);
        
      }
    }

    if (sFinalText + sInterim) {
      // alert('sFinalText3: ' + sFinalText + '\nsInterim: ' + sInterim);
      textarea.value = sFinalText + sInterim;
    }

    fResetSilenceTimer();
  };

  recognition.onend = () => {
    bListening = false;
    clearTimeout(iSilenceTimer);
    // micBtn.textContent = "🎤 Speak";
    textarea.classList.remove("listening");
    micBtn.classList.remove("listening");
  };

  recognition.onerror = (event) => {
    console.log("Speech error:", event.error);
    clearTimeout(iSilenceTimer);
  };
} else {
  micBtn.disabled = true;
  micBtn.textContent = "Speech not supported";
}