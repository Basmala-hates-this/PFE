import { createContext, useCallback, useContext, useRef, useState } from 'react';

/**
 * VoiceCommandContext
 *
 * Owns:
 *  - the live command registry (what's actionable RIGHT NOW, based on what's mounted)
 *  - listening state (real mic wiring comes later — for now this just exposes
 *    a `simulateTranscript` dev helper so we can test registry + matching in isolation)
 *  - dictation mode (a registered command can grab raw speech for a form field)
 *
 * NOT in here yet (next steps):
 *  - actual SpeechRecognition lifecycle
 *  - keyword/pattern matcher
 *  - AI fallback call to /voice/parse-intent
 *  - TTS confirmation / barge-in
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

  // --- dev-only: fake mic input, so we can test matching logic
  //     before wiring up real SpeechRecognition ------------------------

  const simulateTranscript = useCallback((text) => {
    setLastTranscript(text);
    // step 3 (matcher) will hook in here — for now just log what WOULD be searched
    const available = getRegisteredCommands().map((c) => c.id);
    console.log('[voice:sim] transcript:', text, '| available commands:', available);
  }, [getRegisteredCommands]);

  const value = {
    locale,
    isListening,
    setIsListening,
    lastTranscript,
    dictationTargetId,
    startDictation,
    stopDictation,
    register,
    unregister,
    getRegisteredCommands,
    simulateTranscript, // remove once real STT is wired in
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