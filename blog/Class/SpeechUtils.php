<?php
/**
 * SpeechUtils.php — Composants de synthese vocale / Speech synthesis components
 * FR: Regroupe SpeechCard (UI avec controles) et SpeechController (controleur flexible)
 * EN: Consolidates SpeechCard (UI with controls) and SpeechController (flexible controller)
 */
?>
<script>
// ======================================================
// SpeechCard — Composant UI avec textarea et boutons
// ======================================================
class SpeechCard {
  constructor(ids) {
    this.textarea = document.getElementById(ids.textarea);
    this.voiceSelect = document.getElementById(ids.voiceSelect);
    this.playBtn = document.getElementById(ids.playBtn);
    this.pauseBtn = document.getElementById(ids.pauseBtn);
    this.resumeBtn = document.getElementById(ids.resumeBtn);
    this.stopBtn = document.getElementById(ids.stopBtn);
    this.utterance = null;
    this.voices = [];

    this.initVoices();
    this.bindEvents();
  }

  initVoices() {
    const populate = () => {
      this.voices = speechSynthesis.getVoices();
      this.voiceSelect.innerHTML = '';
      let defaultIndex = 0;
      this.voices.forEach((v,i)=>{
        const option = document.createElement('option');
        option.value=i;
        option.textContent = `${v.name} (${v.lang})`;
        this.voiceSelect.appendChild(option);
        if(v.lang.startsWith("fr") && defaultIndex === 0) defaultIndex=i;
      });
      this.voiceSelect.value = defaultIndex;
    };
    speechSynthesis.onvoiceschanged = populate;
    populate();
  }

  bindEvents() {
    this.playBtn.onclick = ()=>this.play();
    this.pauseBtn.onclick = ()=>this.pause();
    this.resumeBtn.onclick = ()=>this.resume();
    this.stopBtn.onclick = ()=>this.stop();
  }

  play() {
    if(!this.textarea.value.trim()) return;
    if(!this.utterance) {
      this.utterance = new SpeechSynthesisUtterance(this.textarea.value);
      const idx = Number(this.voiceSelect.value);
      if(this.voices[idx]) this.utterance.voice = this.voices[idx];
      this.utterance.lang="fr-FR";
      this.utterance.onend = ()=>{ this.utterance=null; };
      speechSynthesis.speak(this.utterance);
    } else if(speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }
  pause(){ if(speechSynthesis.speaking && !speechSynthesis.paused) speechSynthesis.pause(); }
  resume(){ if(speechSynthesis.paused) speechSynthesis.resume(); }
  stop(){ if(speechSynthesis.speaking || speechSynthesis.paused){ speechSynthesis.cancel(); this.utterance=null; } }
}

// ======================================================
// SpeechController — Controleur flexible avec texte direct
// ======================================================
class SpeechController {
    constructor(text, options = {}) {
        this.text = text;
        this.lang = options.lang || 'fr-FR';
        this.voiceSelect = document.getElementById(options.voiceSelectId);
        this.playBtn = document.getElementById(options.playBtnId);
        this.pauseBtn = document.getElementById(options.pauseBtnId);
        this.stopBtn = document.getElementById(options.stopBtnId);
        this.isPaused = false;
        this.utterance = null;

        this._loadVoices();
        this._setupEvents();
    }

    _loadVoices() {
        const load = () => {
            let voices = speechSynthesis.getVoices();
            if (!voices.length) return setTimeout(load, 50);
            this.voiceSelect.innerHTML = '';
            voices.forEach(voice => {
                const option = document.createElement('option');
                option.value = voice.name;
                option.textContent = `${voice.name} (${voice.lang})`;
                this.voiceSelect.appendChild(option);
            });
            const defaultVoice = voices.find(v => v.lang.startsWith('fr')) || voices[0];
            if (defaultVoice) this.voiceSelect.value = defaultVoice.name;
        };
        load();
        speechSynthesis.onvoiceschanged = load;
    }

    _setupEvents() {
        this.playBtn.addEventListener('click', () => this.play());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.voiceSelect.addEventListener('change', () => this.changeVoice());
    }

    play() {
        if (this.isPaused) {
            speechSynthesis.resume();
            this.isPaused = false;
            return;
        }
        speechSynthesis.cancel();
        this.utterance = new SpeechSynthesisUtterance(this.text);
        this.utterance.lang = this.lang;
        const voices = speechSynthesis.getVoices();
        let selectedVoice = voices.find(v => v.name === this.voiceSelect.value) || voices[0];
        this.utterance.voice = selectedVoice;
        speechSynthesis.speak(this.utterance);
    }

    pause() {
        if (speechSynthesis.speaking && !speechSynthesis.paused) {
            speechSynthesis.pause();
            this.isPaused = true;
        }
    }

    stop() {
        speechSynthesis.cancel();
        this.isPaused = false;
    }

    changeVoice() {
        if (speechSynthesis.speaking || speechSynthesis.paused) {
            this.stop();
            this.play();
        }
    }
}
</script>
