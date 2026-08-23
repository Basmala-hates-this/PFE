/**
 * matchCommand
 *
 * Substring matching: a command matches if the transcript CONTAINS one of
 * its registered phrases. When multiple commands match, the longest phrase
 * wins — "open chat and mute notifications" should prefer a phrase like
 * "open chat and mute" over a shorter, less specific "open chat" if both
 * happen to be registered.
 *
 * Returns { command, matchedPhrase } or null if nothing matched.
 */

function normalize(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[.,!?]/g, '')     // strip trailing punctuation STT sometimes adds
    .replace(/\s+/g, ' ');      // collapse whitespace
}

export function matchCommand(transcript, commands) {
  const normalizedTranscript = normalize(transcript);
  if (!normalizedTranscript) return null;

  let best = null; // { command, matchedPhrase }

  for (const command of commands) {
    const phrases = command.phrases ?? [];
    for (const phrase of phrases) {
      const normalizedPhrase = normalize(phrase);
      if (!normalizedPhrase) continue;

      if (normalizedTranscript.includes(normalizedPhrase)) {
        // longest phrase = most specific = wins
        if (!best || normalizedPhrase.length > best.matchedPhrase.length) {
          best = { command, matchedPhrase: normalizedPhrase };
        }
      }
    }
  }

  return best;
}