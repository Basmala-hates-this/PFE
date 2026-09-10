import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { matchCommand } from './matchCommand';
import { parseIntentWithAI } from './voiceIntentAI';
import { speak } from './voiceTTS';
import { useEffect } from 'react';

/**
 * VoiceCommandContext
 *
 * Owns:
 *  - the live command registry (what's actionable RIGHT NOW, based on what's mounted)
 *  - continuous mic lifecycle: persistent stream + silence-detection (VAD) to
 *    auto-segment utterances, each one sent to /ai/transcribe -> processTranscript
 *  - intent resolution: keyword/substring match first, AI fallback (/ai/chat) on miss,
 *    with a spoken confirmation (or "didn't catch that") after each attempt
 *  - dictation mode (a registered command can grab raw speech for a form field)
 *
 * NOT in here yet (next steps):
 *  - barge-in (interrupting TTS playback by talking over it — currently strict
 *    turn-taking only: mic waits for TTS to finish, never overlaps it)
 *  - unsupported-browser / mic-denied UX beyond micError state
 */

const VoiceCommandContext = createContext(null);

export function VoiceCommandProvider({ children, locale = 'en' }) {
  // registry: Map<id, { id, phrases: string[], handler: fn, dictatable: boolean, label: string }>
  const registryRef = useRef(new Map());

  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [dictationTargetId, setDictationTargetId] = useState(null); // id of field currently receiving raw speech

  const ttsActiveCountRef = useRef(0);

  // --- registry API -------------------------------------------------

  const register = useCallback((command) => {
    if (!command?.id) {
      console.warn('[voice] register() called without an id, ignoring', command);
      return () => {};
    }
    registryRef.current.set(command.id, command);

    // return an unregister fn so components can clean up on unmount
    return () => {
      registryRef.current.delete(command.id);
    };
  }, []);

  const unregister = useCallback((id) => {
    registryRef.current.delete(id);
  }, []);

  const getRegisteredCommands = useCallback(() => {
    return Array.from(registryRef.current.values());
  }, []);

  // --- dictation mode -------------------------------------------------

  // const startDictation = useCallback((id) => {
  //   setDictationTargetId(id);
  // }, []);

  // const stopDictation = useCallback(() => {
  //   setDictationTargetId(null);
  // }, []);

  const dictationResolverRef = useRef(null);

const startDictation = useCallback((id, onResult) => {
  dictationTargetIdRef.current = id; 
  setDictationTargetId(id);
  dictationResolverRef.current = onResult ?? null;
}, []);

const stopDictation = useCallback(() => {
  dictationTargetIdRef.current = null;
  setDictationTargetId(null);
  dictationResolverRef.current = null;
}, []);


  // --- unmatched-speech handoff ---------------------------------------
  // When speech matches no command, the default is a spoken "didn't catch
  // that." Whichever page has FloatingHelper mounted can register itself
  // here to intercept unmatched speech and treat it as a real question
  // instead — scoped by mount/unmount just like the command registry.
  const unmatchedHandlerRef = useRef(null);

  const registerUnmatchedHandler = useCallback((handler) => {
    unmatchedHandlerRef.current = handler;
    return () => {
      if (unmatchedHandlerRef.current === handler) {
        unmatchedHandlerRef.current = null;
      }
    };
  }, []);

  // --- turn-taking with TTS: mic and TTS output never run "active" at the same time ---
  // Whatever plays TTS (confirmations, FloatingHelper's speakText, etc.) MUST call
  // notifyTTSStart()/notifyTTSEnd() around playback so the mic doesn't transcribe itself.

  const notifyTTSStart = useCallback(() => {
     ttsActiveCountRef.current += 1;
  }, []);

  const notifyTTSEnd = useCallback(() => {
    ttsActiveCountRef.current = Math.max(0, ttsActiveCountRef.current - 1);
  }, []);

  // polls until TTS finishes, so the continuous loop can pause before starting a new segment
const waitUntilTTSFinished = useCallback(() => {
  return new Promise((resolve) => {
    if (ttsActiveCountRef.current <= 0) return resolve();
    const check = setInterval(() => {
      if (ttsActiveCountRef.current <= 0) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}, []);

  // convenience wrapper: speaks text AND handles the notify start/end pairing,
  // so call sites (processTranscript, etc.) don't have to repeat the plumbing
  const speakConfirmation = useCallback((text) => {
  notifyTTSStart(); // flip synchronously, don't wait for speak()'s async onStart
  return new Promise((resolve) => {
    speak(text, {
      onEnd: () => {
        notifyTTSEnd();
        resolve();
      },
    });
  });
}, [notifyTTSStart, notifyTTSEnd]);

  const [lastMatch, setLastMatch] = useState(null); // { commandId, matchedPhrase, source } | null
  const [isProcessing, setIsProcessing] = useState(false); // true while AI fallback is in flight

  // --- core: run a transcript through the matcher and execute on hit ----
  // This is the function both simulateTranscript (dev) and the real
  // mic result handler (later) will call. Now async: keyword match is
  // instant, but AI fallback is a network round trip.

  const processTranscript = useCallback(async (text) => {
    setLastTranscript(text);

  
if (dictationTargetIdRef.current) {
  console.log('[voice] dictation ->', dictationTargetIdRef.current, ':', text);
  setLastMatch(null);
  dictationResolverRef.current?.(text);
  return { matched: false, dictation: true };
}

    const commands = getRegisteredCommands();

    // fast path: keyword/substring match, no API cost
    const keywordResult = matchCommand(text, commands);
    if (keywordResult) {
      console.log('[voice] matched (keyword):', keywordResult.command.id, '(phrase:', `"${keywordResult.matchedPhrase}")`);
      setLastMatch({ commandId: keywordResult.command.id, matchedPhrase: keywordResult.matchedPhrase, source: 'keyword' });
      keywordResult.command.handler?.();
      await speakConfirmation(keywordResult.command.label);
      return { matched: true, commandId: keywordResult.command.id, source: 'keyword' };
    }

    // slow path: no keyword hit, ask the AI to classify intent against
    // the currently registered commands
    console.log('[voice] no keyword match for:', text, '-> falling back to AI intent parsing');
    setIsProcessing(true);
    setLastMatch(null);

    try {
      const aiResult = await parseIntentWithAI(text, commands);

      if (aiResult.action === 'command') {
        const matchedCommand = commands.find((c) => c.id === aiResult.target);
        // matchedCommand could be undefined if it unmounted while the request was in flight
        if (matchedCommand) {
          console.log('[voice] matched (AI fallback):', matchedCommand.id);
          setLastMatch({ commandId: matchedCommand.id, matchedPhrase: null, source: 'ai' });
          matchedCommand.handler?.();
         await  speakConfirmation(matchedCommand.label);
          return { matched: true, commandId: matchedCommand.id, source: 'ai' };
        }
      }

      console.log('[voice] AI fallback also found nothing for:', text);
      if (unmatchedHandlerRef.current) {
  console.log('[voice] delegating unmatched speech to registered handler');
  await unmatchedHandlerRef.current(text); // block the loop through the whole ai/chat round trip + spoken reply
  return { matched: false, delegated: true };
}
     await speakConfirmation(CONFIRM_STRINGS[localeRef.current]?.noMatch ?? CONFIRM_STRINGS.en.noMatch);
      return { matched: false };
    } finally {
      setIsProcessing(false);
    }
  }, [ getRegisteredCommands, speakConfirmation]);

  // --- continuous listening: persistent stream + silence-based segmentation ---
  // Instead of push-to-talk, we keep the mic stream open and use volume
  // monitoring (basic VAD) to detect when the user starts/stops talking.
  // Each detected utterance becomes its own MediaRecorder segment that
  // gets transcribed + processed independently, then we listen again.

  const SILENCE_THRESHOLD = 12;        // 0-255 scale (getByteTimeDomainData deviation) — below this = quiet
  const SILENCE_DURATION_MS = 1100;    // sustained quiet this long after speech = utterance ended
  const MIN_SPEECH_DURATION_MS = 300;  // ignore silence-based cutoff before this much speech has happened
  const MAX_SEGMENT_DURATION_MS = 15000; // hard cap so a long ramble can't record forever
  const IDLE_TIMEOUT_MS = 8000;        // if NO speech at all detected in this window, abort segment (don't waste an API call)

  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const vadFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  const [isTranscribing, setIsTranscribing] = useState(false); // true while audio is uploading/transcribing
  const [micError, setMicError] = useState(null);
  const continuousModeRef = useRef(false); // survives across async segment boundaries, unlike state

  const dictationTargetIdRef = useRef(null);


  const stopVadLoop = useCallback(() => {
    if (vadFrameRef.current) {
      cancelAnimationFrame(vadFrameRef.current);
      vadFrameRef.current = null;
    }
  }, []);

  // Records ONE utterance: starts a MediaRecorder on the shared stream,
  // watches volume via AnalyserNode, and stops itself once it detects
  // speech-then-silence (or hits a safety timeout). Resolves with the
  // audio Blob, or null if nothing worth sending was captured.
  const recordOneSegment = useCallback(() => {
    return new Promise((resolve) => {
      const stream = streamRef.current;
      const analyser = analyserRef.current;
      if (!stream || !analyser) return resolve(null);

      const chunks = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      let resolved = false;
      let stopReason = null;

      // The ONLY place that builds the final Blob and resolves — must run
      // after the browser has actually delivered data via ondataavailable,
      // which is guaranteed to have fired by the time onstop fires.
      recorder.onstop = () => {
        if (resolved) return;
        resolved = true;
        // Only ever hand back audio for transcription if OUR OWN detection
        // actually heard speech AND the segment ended naturally. Idle-timeouts
        // (silence the whole time) and aborts (mode-off / tts-speaking) still
        // have non-empty blobs — MediaRecorder captures ambient noise regardless
        // — but sending those to Whisper reliably produces hallucinated text
        // ("Open shot did you freeze?", random language switches, etc.) on
        // near-silent audio. Discard them here, before they ever reach the API.
        const shouldTranscribe = stopReason === 'silence-after-speech' || stopReason === 'max-duration-cap';
        const blob = shouldTranscribe && chunks.length ? new Blob(chunks, { type: 'audio/webm' }) : null;
        console.log('[voice] segment finalized (', stopReason, '), transcribing:', shouldTranscribe, ', blob size:', blob?.size ?? 0);
        resolve(blob);
      };

      // Triggers do NOT build a Blob themselves — chunks may still be empty
      // at this exact moment (data arrives asynchronously). They just stop
      // the recorder and record WHY, for logging; onstop above does the rest.
      const finish = (reason) => {
        if (resolved) return;
        stopReason = reason;
        stopVadLoop();
        if (recorder.state !== 'inactive') {
          recorder.stop(); // -> fires ondataavailable (with real data) -> fires onstop above
        } else {
          // already inactive somehow — resolve now with whatever chunks exist
          recorder.onstop();
        }
      };

      recorder.start();
      console.log('[voice] segment recording started');

      const startedAt = Date.now();
      let speechStartedAt = null;
      let lastLoudAt = null;
      const dataArray = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (!continuousModeRef.current) { console.log('[voice] segment aborted: mode turned off'); return finish('mode-off'); }
        if (ttsActiveCountRef.current > 0) { console.log('[voice] segment aborted: TTS started speaking'); return finish('tts-speaking'); }
        analyser.getByteTimeDomainData(dataArray);
        // rough volume: average deviation from the 128 (silence) midpoint
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += Math.abs(dataArray[i] - 128);
        const volume = sum / dataArray.length;

        const now = Date.now();
        const elapsed = now - startedAt;

        if (volume > SILENCE_THRESHOLD) {
          if (!speechStartedAt) {
            speechStartedAt = now;
            console.log('[voice] speech detected, volume:', volume.toFixed(1));
          }
          lastLoudAt = now;
        }

        if (!speechStartedAt && elapsed > IDLE_TIMEOUT_MS) {
          // never heard anything worth transcribing — bail without hitting the API
          console.log('[voice] segment idle-timed-out with no speech detected (check mic input / SILENCE_THRESHOLD)');
          return finish('idle-timeout');
        }

        if (speechStartedAt) {
          const spokeFor = lastLoudAt - speechStartedAt;
          const quietFor = now - lastLoudAt;
          if (spokeFor >= MIN_SPEECH_DURATION_MS && quietFor >= SILENCE_DURATION_MS) {
            return finish('silence-after-speech'); // natural end of utterance
          }
        }

        if (elapsed > MAX_SEGMENT_DURATION_MS) {
          return finish('max-duration-cap'); // safety cap
        }

        vadFrameRef.current = requestAnimationFrame(tick);
      };

      vadFrameRef.current = requestAnimationFrame(tick);
    });
  }, [stopVadLoop]);

  const localeRef = useRef(locale);
useEffect(() => {
  localeRef.current = locale;
}, [locale]);

  // The continuous loop: record a segment -> transcribe+process it -> repeat,
  // for as long as continuousModeRef.current stays true.
  const continuousLoop = useCallback(async () => {
    while (continuousModeRef.current) {
      await waitUntilTTSFinished(); // don't start recording while TTS is talking
      if (!continuousModeRef.current) break;

      const blob = await recordOneSegment();
      if (!continuousModeRef.current) break; // mode turned off while we were recording

      if (!blob || blob.size === 0) { console.log('[voice] no usable audio captured, listening again'); continue; }

      console.log('[voice] sending segment to /ai/transcribe, blob size:', blob.size);
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/transcribe`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`transcribe request failed: ${res.status}`);
        const data = await res.json();
        console.log('[voice] transcribed text:', data.text);

        // if (data.text?.trim()) {
        //   await processTranscript(data.text); // handles its own keyword/AI-fallback + isProcessing state
        // } else {
        //   console.log('[voice] transcription came back empty');
        // }
        if (data.text?.trim()) {
  if (isWakeModeRef.current) {
    if (matchesWakePhrase(data.text)) {
      console.log('[voice] wake word matched — switching to active listening');
      isWakeModeRef.current = false;
      setIsWakeListening(false);
      setIsListening(true);
      
     await speakConfirmation(CONFIRM_STRINGS[localeRef.current]?.listening ?? CONFIRM_STRINGS.en.listening);
    }
    // no match -> discard silently, wake loop just keeps listening
  } else {
    await processTranscript(data.text); // handles its own keyword/AI-fallback + isProcessing state
  }
} else {
  console.log('[voice] transcription came back empty');
}
      } catch (err) {
        console.error('[voice] continuous loop transcribe/process failed:', err);
        setMicError('transcribe-failed');
      } finally {
        setIsTranscribing(false);
      }
      // loop repeats — next segment starts automatically
    }
  }, [recordOneSegment, processTranscript, waitUntilTTSFinished]);

  // const startListening = useCallback(async () => {
  //   if (continuousModeRef.current) return; // already running
  //   setMicError(null);

  //   let stream;
  //   try {
  //     stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //   } catch (err) {
  //     console.error('[voice] mic permission denied or unavailable:', err);
  //     setMicError('mic-denied');
  //     return;
  //   }

  //   streamRef.current = stream;
  //   const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  //   if (audioContext.state === 'suspended') {
  //     await audioContext.resume(); // some browsers create contexts suspended — silent analyser otherwise
  //   }
  //   console.log('[voice] AudioContext state:', audioContext.state);
  //   const source = audioContext.createMediaStreamSource(stream);
  //   const analyser = audioContext.createAnalyser();
  //   analyser.fftSize = 512;
  //   source.connect(analyser);
  //   audioContextRef.current = audioContext;
  //   analyserRef.current = analyser;

  //   continuousModeRef.current = true;
  //   setIsListening(true);
  //   continuousLoop();
  // }, [continuousLoop]);

  const isWakeModeRef = useRef(false); // true = loop is only listening for the wake phrase
const [isWakeListening, setIsWakeListening] = useState(false);

// const WAKE_PHRASES = ['hey glaukopis', 'ok glaukopis', 'يا غلوكوبيس', 'او كي غلوكوبيس'];
// add whatever wording actually fits — normalize handles case/diacritics so keep entries simple

const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();


// Levenshtein edit distance 
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

const WAKE_TRIGGERS = {
  en: [
    { words: ['glau'], maxDistance: 1 },
    { words: ['hoot'], maxDistance: 1 },
    { words: ['hey', 'owl'], maxDistance: 1 }, // "owl" alone is too common to trust bare...fuck duolingo......
    { words: ['glaukopis'], maxDistance: 2 },
  ],
  fr: [
    { words: ['glau'], maxDistance: 1 },              // reads/sounds fine as-is in French
    { words: ['hou'], maxDistance: 1 },                // "hou hou" — the standard FR owl-hoot sound
    { words: ['salut', 'hibou'], maxDistance: 1 },     // "hey owl" — two-word, same false-positive guard as EN
    { words: ['glaukopis'], maxDistance: 2 },
  ],
  ar: [
    { words: ['غلو'], maxDistance: 1 },                // phonetic "glau"
    { words: ['هوت'], maxDistance: 1 },                // phonetic "hoot"
    { words: ['يا', 'بومة'], maxDistance: 1 },          // "hey owl"
    { words: ['غلوكوبيس'], maxDistance: 2 },            // keep  original full-brand-name trigger too
  ],
};

const WAKE_WORD_DISPLAY = {
  en: ['Glau', 'Hoot', 'Hey Owl'],
  fr: ['Glau', 'Hou', 'Salut Hibou'],
  ar: ['غلو', 'هوت', 'يا بومة'],
};

const CONFIRM_STRINGS = {
  en: { listening: "I'm listening.", noMatch: "Sorry, I didn't catch that." },
  fr: { listening: "Je vous écoute.", noMatch: "Désolé, je n'ai pas compris." },
  ar: { listening: "أنا أستمع.", noMatch: "عذرًا، لم أفهم ذلك." },
};

// matchesWakePhrase closes over `locale` from the component's props — no
// need to sniff script from the text anymore, we already know the language
const matchesWakePhrase = (text) => {
   const words = normalize(text).split(/\s+/).filter(Boolean);
  const triggers = WAKE_TRIGGERS[localeRef.current] || WAKE_TRIGGERS.en;

  return triggers.some(({ words: triggerWords, maxDistance }) => {
    for (let i = 0; i <= words.length - triggerWords.length; i++) {
      const isMatch = triggerWords.every((tw, j) => levenshtein(words[i + j], tw) <= maxDistance);
      if (isMatch) return true;
    }
    return false;
  });
};


const startMicSession = useCallback(async (mode) => { // mode: 'wake' | 'active'
  if (continuousModeRef.current) return; // already running (either mode)
  setMicError(null);

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.error('[voice] mic permission denied or unavailable:', err);
    setMicError('mic-denied');
    return;
  }

  streamRef.current = stream;
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  audioContextRef.current = audioContext;
  analyserRef.current = analyser;

  continuousModeRef.current = true;
  isWakeModeRef.current = mode === 'wake';
  setIsWakeListening(mode === 'wake');
  setIsListening(mode === 'active');
  continuousLoop();
}, [continuousLoop]);

const startListening = useCallback(() => startMicSession('active'), [startMicSession]);
const startWakeListening = useCallback(() => startMicSession('wake'), [startMicSession]);

  const stopListening = useCallback(() => {
    console.log('[voice] stopListening called');
    continuousModeRef.current = false;
    isWakeModeRef.current = false;   
    setIsWakeListening(false); 
    stopVadLoop();
    if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    setIsListening(false);
  }, [stopVadLoop]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // dev-only alias for manual testing without speaking
  const simulateTranscript = processTranscript;

const value = {
    locale,
    wakeWordHints: WAKE_WORD_DISPLAY[locale] || WAKE_WORD_DISPLAY.en,
    isListening,
    setIsListening,
    isWakeListening,
    startWakeListening,
    isTranscribing,
    micError,
    startListening,
    stopListening,
    toggleListening,
    notifyTTSStart,
    notifyTTSEnd,
    speakConfirmation,
    lastTranscript,
    lastMatch,
    isProcessing,
    dictationTargetId,
    startDictation,
    stopDictation,
    registerUnmatchedHandler,
    register,
    unregister,
    getRegisteredCommands,
    processTranscript,
    simulateTranscript,
  };
  
  console.log(micError)

  return (
    <VoiceCommandContext.Provider value={value}>
      {children}
    </VoiceCommandContext.Provider>
  );
}

export function useVoiceCommandContext() {
  const ctx = useContext(VoiceCommandContext);
  if (!ctx) {
    throw new Error('useVoiceCommandContext must be used within a VoiceCommandProvider');
  }
  return ctx;
}