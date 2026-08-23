import { useEffect, useRef } from 'react';
import { useVoiceCommandContext } from '../components/VoiceCommandContext.jsx';

/**
 * useVoiceCommand
 *
 * Registers a voice command for as long as the calling component is mounted.
 * This is what makes voice scope contextual — a command registered inside
 * PostModal only exists while PostModal is open, so "next" or "submit"
 * never collides with some other page's "next"/"submit".
 *
 * Usage:
 *   useVoiceCommand({
 *     id: 'open-chat',
 *     phrases: ['open chat', 'go to chat', 'show messages'],
 *     handler: () => navigate('/chat'),
 *     label: 'Open chat',       // optional, for a "what can I say" UI later
 *     dictatable: false,        // true = this command hands off to dictation mode instead of firing handler
 *   });
 *
 * Pass `active: false` to conditionally register (e.g. only when a modal is open).
 */
export function useVoiceCommand({ id, phrases, handler, label, dictatable = false, active = true }) {
  const { register } = useVoiceCommandContext();

  // keep the latest handler without forcing a re-register on every render
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!active) return undefined;

    const unregister = register({
      id,
      phrases,
      label: label ?? id,
      dictatable,
      handler: (...args) => handlerRef.current?.(...args),
    });

    return unregister;
    // intentionally NOT depending on `handler` — handlerRef keeps it fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, active, register, JSON.stringify(phrases), dictatable, label]);
}