import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { matchCommand } from './matchCommand';
import { parseIntentWithAI } from './voiceIntentAI';
import { speak } from './Voicetts';

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

  const startDictation = useCallback((id) => {
    setDictationTargetId(id);
  }, []);

  const stopDictation = useCallback(() => {
    setDictationTargetId(null);
  }, []);

  // --- turn-taking with TTS: mic and TTS output never run "active" at the same time ---
  // Whatever plays TTS (confirmations, FloatingHelper's speakText, etc.) MUST call
  // notifyTTSStart()/notifyTTSEnd() around playback so the mic doesn't transcribe itself.
  const ttsSpeakingRef = useRef(false);

  const notifyTTSStart = useCallback(() => {
    ttsSpeakingRef.current = true;
  }, []);

  const notifyTTSEnd = useCallback(() => {
    ttsSpeakingRef.current = false;
  }, []);

  // polls until TTS finishes, so the continuous loop can pause before starting a new segment
  const waitUntilTTSFinished = useCallback(() => {
    return new Promise((resolve) => {
      if (!ttsSpeakingRef.current) return resolve();
      const check = setInterval(() => {
        if (!ttsSpeakingRef.current) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }, []);

  // convenience wrapper: speaks text AND handles the notify start/end pairing,
  // so call sites (processTranscript, etc.) don't have to repeat the plumbing
  const speakConfirmation = useCallback((text) => {
    speak(text, { onStart: notifyTTSStart, onEnd: notifyTTSEnd });
  }, [notifyTTSStart, notifyTTSEnd]);

  const [lastMatch, setLastMatch] = useState(null); // { commandId, matchedPhrase, source } | null
  const [isProcessing, setIsProcessing] = useState(false); // true while AI fallback is in flight

  // --- core: run a transcript through the matcher and execute on hit ----
  // This is the function both simulateTranscript (dev) and the real
  // mic result handler (later) will call. Now async: keyword match is
  // instant, but AI fallback is a network round trip.

  const processTranscript = useCallback(async (text) => {
    setLastTranscript(text);

    if (dictationTargetId) {
      // dictation mode intercepts BEFORE matching — raw speech, not a command
      console.log('[voice] dictation ->', dictationTargetId, ':', text);
      setLastMatch(null);
      // actual field-filling wiring happens wherever dictationTargetId is consumed
      return { matched: false, dictation: true };
    }

    const commands = getRegisteredCommands();

    // fast path: keyword/substring match, no API cost
    const keywordResult = matchCommand(text, commands);
    if (keywordResult) {
      console.log('[voice] matched (keyword):', keywordResult.command.id, '(phrase:', `"${keywordResult.matchedPhrase}")`);
      setLastMatch({ commandId: keywordResult.command.id, matchedPhrase: keywordResult.matchedPhrase, source: 'keyword' });
      keywordResult.command.handler?.();
      speakConfirmation(keywordResult.command.label);
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
          speakConfirmation(matchedCommand.label);
          return { matched: true, commandId: matchedCommand.id, source: 'ai' };
        }
      }

      console.log('[voice] AI fallback also found nothing for:', text);
      speakConfirmation("Sorry, I didn't catch that.");
      return { matched: false };
    } finally {
      setIsProcessing(false);
    }
  }, [dictationTargetId, getRegisteredCommands, speakConfirmation]);

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
      const finish = (result) => {
        if (resolved) return;
        resolved = true;
        stopVadLoop();
        if (recorder.state !== 'inactive') recorder.stop();
        resolve(result);
      };

      recorder.onstop = () => {
        if (!resolved) {
          // stopped for a reason other than our own finish() call (e.g. mode turned off)
          resolve(chunks.length ? new Blob(chunks, { type: 'audio/webm' }) : null);
        }
      };

      recorder.start();

      const startedAt = Date.now();
      let speechStartedAt = null;
      let lastLoudAt = null;
      const dataArray = new Uint8Array(analyser.fftSize);

      const tick = () => {
        if (!continuousModeRef.current) return finish(null); // mode was turned off mid-segment
        if (ttsSpeakingRef.current) return finish(null); // TTS started talking — abandon this segment, don't transcribe our own voice

        analyser.getByteTimeDomainData(dataArray);
        // rough volume: average deviation from the 128 (silence) midpoint
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += Math.abs(dataArray[i] - 128);
        const volume = sum / dataArray.length;

        const now = Date.now();
        const elapsed = now - startedAt;

        if (volume > SILENCE_THRESHOLD) {
          if (!speechStartedAt) speechStartedAt = now;
          lastLoudAt = now;
        }

        if (!speechStartedAt && elapsed > IDLE_TIMEOUT_MS) {
          // never heard anything worth transcribing — bail without hitting the API
          return finish(null);
        }

        if (speechStartedAt) {
          const spokeFor = lastLoudAt - speechStartedAt;
          const quietFor = now - lastLoudAt;
          if (spokeFor >= MIN_SPEECH_DURATION_MS && quietFor >= SILENCE_DURATION_MS) {
            return finish(new Blob(chunks, { type: 'audio/webm' })); // natural end of utterance
          }
        }

        if (elapsed > MAX_SEGMENT_DURATION_MS) {
          return finish(new Blob(chunks, { type: 'audio/webm' })); // safety cap
        }

        vadFrameRef.current = requestAnimationFrame(tick);
      };

      vadFrameRef.current = requestAnimationFrame(tick);
    });
  }, [stopVadLoop]);

  // The continuous loop: record a segment -> transcribe+process it -> repeat,
  // for as long as continuousModeRef.current stays true.
  const continuousLoop = useCallback(async () => {
    while (continuousModeRef.current) {
      await waitUntilTTSFinished(); // don't start recording while TTS is talking
      if (!continuousModeRef.current) break;

      const blob = await recordOneSegment();
      if (!continuousModeRef.current) break; // mode turned off while we were recording

      if (!blob || blob.size === 0) continue; // idle timeout / nothing captured — listen again

      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/transcribe`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('transcribe request failed');
        const data = await res.json();

        if (data.text?.trim()) {
          await processTranscript(data.text); // handles its own keyword/AI-fallback + isProcessing state
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

  const startListening = useCallback(async () => {
    if (continuousModeRef.current) return; // already running
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
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    continuousModeRef.current = true;
    setIsListening(true);
    continuousLoop();
  }, [continuousLoop]);

  const stopListening = useCallback(() => {
    continuousModeRef.current = false;
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
    isListening,
    setIsListening,
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
    register,
    unregister,
    getRegisteredCommands,
    processTranscript,
    simulateTranscript, // dev-only alias for processTranscript, useful for testing without speaking
  };

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