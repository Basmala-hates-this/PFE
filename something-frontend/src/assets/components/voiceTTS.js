/**
 * voiceTTS.js
 *
 * Speaks a short confirmation out loud (e.g. "Opening chat", "Didn't catch that").
 * Same voice-selection / language-detection approach as FloatingHelper.speakText,
 * but generic — no chat-bubble index, just text in -> speech out.
 *
 * IMPORTANT: always call this with onStart/onEnd wired to the context's
 * notifyTTSStart/notifyTTSEnd, or the continuous mic loop will try to
 * transcribe the TTS voice as a new command.
 */

const PREFERRED_VOICES = {
  fr: 'Microsoft Julie',
  en: 'Microsoft Zira',
  ar: 'Microsoft Julie',
};

function detectLangFromText(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[àâçéèêëîïôùûüœæ]/i.test(text)) return 'fr';
  return 'en';
}

/**
 * @param {string} text - what to say
 * @param {{ onStart?: () => void, onEnd?: () => void }} callbacks
 */
export function speak(text, { onStart, onEnd } = {}) {
  console.log('[voice:tts] speak() called with:', text);

  if (!text?.trim()) {
    console.log('[voice:tts] empty text, skipping');
    onEnd?.();
    return;
  }

  if (!window.speechSynthesis) {
    console.warn('[voice:tts] window.speechSynthesis not available in this browser');
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel(); // interrupt anything currently playing

  const doSpeak = (voices) => {
    console.log('[voice:tts] speaking now, voices available:', voices.length);
    const utter = new SpeechSynthesisUtterance(text);
    const langPrefix = detectLangFromText(text);
    const fullLang = langPrefix === 'fr' ? 'fr-FR' : langPrefix === 'ar' ? 'ar-DZ' : 'en-US';

    const preferred = voices.find((v) => v.name === PREFERRED_VOICES[langPrefix]);
    const exact = voices.find((v) => v.lang === fullLang);
    const prefix = voices.find((v) => v.lang.startsWith(langPrefix));

    utter.voice = preferred || exact || prefix || null;
    utter.lang = fullLang;
    utter.rate = 0.95;

    utter.onstart = () => { console.log('[voice:tts] utterance started'); onStart?.(); };
    utter.onend = () => { console.log('[voice:tts] utterance ended'); onEnd?.(); };
    utter.onerror = (e) => { console.error('[voice:tts] utterance error:', e.error); onEnd?.(); };

    window.speechSynthesis.speak(utter);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    console.log('[voice:tts] no voices yet, waiting on onvoiceschanged (with 300ms fallback)');
    let fired = false;
    window.speechSynthesis.onvoiceschanged = () => {
      if (fired) return;
      fired = true;
      doSpeak(window.speechSynthesis.getVoices());
    };
    // some browsers never fire onvoiceschanged reliably — don't hang forever
    setTimeout(() => {
      if (fired) return;
      fired = true;
      console.log('[voice:tts] onvoiceschanged never fired, proceeding with whatever voices exist now');
      doSpeak(window.speechSynthesis.getVoices());
    }, 300);
  }
}