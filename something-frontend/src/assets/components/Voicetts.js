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
  if (!text?.trim() || !window.speechSynthesis) {
    onEnd?.(); // nothing to say / not supported — release the "TTS speaking" gate immediately
    return;
  }

  window.speechSynthesis.cancel(); // interrupt anything currently playing

  const doSpeak = (voices) => {
    const utter = new SpeechSynthesisUtterance(text);
    const langPrefix = detectLangFromText(text);
    const fullLang = langPrefix === 'fr' ? 'fr-FR' : langPrefix === 'ar' ? 'ar-DZ' : 'en-US';

    const preferred = voices.find((v) => v.name === PREFERRED_VOICES[langPrefix]);
    const exact = voices.find((v) => v.lang === fullLang);
    const prefix = voices.find((v) => v.lang.startsWith(langPrefix));

    utter.voice = preferred || exact || prefix || null;
    utter.lang = fullLang;
    utter.rate = 0.95;

    utter.onstart = () => onStart?.();
    utter.onend = () => onEnd?.();
    utter.onerror = () => onEnd?.(); // don't leave the TTS gate stuck "on" if playback fails

    window.speechSynthesis.speak(utter);
  };

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    doSpeak(voices);
  } else {
    // voice list loads async on first call in some browsers
    window.speechSynthesis.onvoiceschanged = () => doSpeak(window.speechSynthesis.getVoices());
  }
}