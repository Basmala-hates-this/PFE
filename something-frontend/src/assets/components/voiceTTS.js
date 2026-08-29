/**
 * voiceTTS.js
 *
 * Speaks a short confirmation out loud (e.g. "Opening chat", "Didn't catch that").
 * Backed by /ai/speak on your backend (Groq Orpheus for en/ar, proxied Google
 * Translate TTS for fr) instead of the browser's window.speechSynthesis —
 * that API is unreliable across browsers (missing entirely in some, silently
 * gutted by privacy features in others, as we found testing on Opera/Brave).
 *
 * IMPORTANT: always call this with onStart/onEnd wired to the context's
 * notifyTTSStart/notifyTTSEnd, or the continuous mic loop will try to
 * transcribe the TTS audio as a new command.
 */

function detectLangFromText(text) {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[àâçéèêëîïôùûüœæ]/i.test(text)) return 'fr';
  return 'en';
}

let currentAudio = null; // so a new speak() call can interrupt a playing one

/**
 * @param {string} text - what to say
 * @param {{ onStart?: () => void, onEnd?: () => void }} callbacks
 */
export async function speak(text, { onStart, onEnd } = {}) {
  console.log('[voice:tts] speak() called with:', text);

  if (!text?.trim()) {
    console.log('[voice:tts] empty text, skipping');
    onEnd?.();
    return;
  }

  // interrupt anything currently playing, same intent as speechSynthesis.cancel()
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const lang = detectLangFromText(text);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang }),
    });
    if (!response.ok) throw new Error(`TTS request failed: ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;

    audio.onplay = () => { console.log('[voice:tts] playback started'); onStart?.(); };
    audio.onended = () => {
      console.log('[voice:tts] playback ended');
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.();
    };
    audio.onerror = (e) => {
      console.error('[voice:tts] playback error:', e);
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      onEnd?.(); // don't leave the TTS gate stuck "on" if playback fails
    };

    await audio.play();
  } catch (err) {
    console.error('[voice:tts] TTS fetch/playback failed:', err);
    onEnd?.(); // release the gate even on total failure
  }
}