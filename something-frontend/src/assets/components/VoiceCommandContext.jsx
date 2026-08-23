import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { matchCommand } from './matchCommand';
import { parseIntentWithAI } from './voiceIntentAI';

/**
 * VoiceCommandContext
 *
 * Owns:
 *  - the live command registry (what's actionable RIGHT NOW, based on what's mounted)
 *  - mic lifecycle (record via MediaRecorder -> /ai/transcribe -> processTranscript,
 *    same pattern as FloatingHelper's toggleVoice)
 *  - intent resolution: keyword/substring match first, AI fallback (/ai/chat) on miss
 *  - dictation mode (a registered command can grab raw speech for a form field)
 *
 * NOT in here yet (next steps):
 *  - TTS confirmation of executed commands
 *  - barge-in (cutting TTS playback when new speech starts)
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
          return { matched: true, commandId: matchedCommand.id, source: 'ai' };
        }
      }

      console.log('[voice] AI fallback also found nothing for:', text);
      return { matched: false };
    } finally {
      setIsProcessing(false);
    }
  }, [dictationTargetId, getRegisteredCommands]);

  // --- real mic: record -> /ai/transcribe -> processTranscript ---------
  // Same MediaRecorder + endpoint pattern FloatingHelper already uses,
  // just piped into the command registry instead of a chat bubble.

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [isTranscribing, setIsTranscribing] = useState(false); // true while audio is uploading/transcribing
  const [micError, setMicError] = useState(null);

  const startListening = useCallback(async () => {
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
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsListening(false);

      const blob = new Blob(chunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      setIsTranscribing(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/ai/transcribe`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error('transcribe request failed');
        const data = await res.json();

        if (data.text?.trim()) {
          await processTranscript(data.text);
        } else {
          console.log('[voice] transcription came back empty');
        }
      } catch (err) {
        console.error('[voice] transcription failed:', err);
        setMicError('transcribe-failed');
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    setIsListening(true);
  }, [processTranscript]);

  const stopListening = useCallback(() => {
    // triggers recorder.onstop above, which does the actual transcribe + process
    mediaRecorderRef.current?.stop();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // dev-only alias so existing test buttons keep working
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
    simulateTranscript, // dev-only alias for processTranscript, remove once real STT is wired in
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