import { useCallback } from 'react';
import { useVoiceCommandContext } from '../components/VoiceCommandContext.jsx';

const CONTROL_WORDS = {
  skip: ['skip', 'passer', 'تخطي'],
  cancel: ['cancel', 'annuler', 'إلغاء'],
  back: ['back', 'previous', 'retour', 'رجوع'],
};

const matchesControl = (text, key) =>
  CONTROL_WORDS[key].some((w) => text.trim().toLowerCase() === w);

/**
 * fields: [{ id, label, setter, validate?, normalize? }]
 * - label is spoken via TTS ("What's your <label>?")
 * - setter(value) is called with the raw or normalized transcript
 * - validate(value) -> bool, triggers a single retry on failure
 * - skip file-upload fields entirely (voice can't attach a file);
 *   just don't include them in `fields`.
 */
export function useGuidedFormFill(fields) {
  const { startDictation, stopDictation, speakConfirmation } = useVoiceCommandContext();

  const askField = useCallback((field) => {
    return new Promise((resolve) => {
      speakConfirmation(`What's your ${field.label}?`);
      startDictation(field.id, (raw) => {
        stopDictation();
        resolve(raw);
      });
    });
  }, [startDictation, stopDictation, speakConfirmation]);

  const runWalkthrough = useCallback(async () => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      let raw = await askField(field);

      if (matchesControl(raw, 'cancel')) {
        speakConfirmation('Okay, cancelled.');
        return;
      }
      if (matchesControl(raw, 'skip')) continue;
      if (matchesControl(raw, 'back') && i > 0) { i -= 2; continue; } // -2 because loop does i++

      let value = field.normalize ? field.normalize(raw) : raw;
      if (field.validate && !field.validate(value)) {
        speakConfirmation(`That didn't sound right for ${field.label} — one more try.`);
        raw = await askField(field);
        value = field.normalize ? field.normalize(raw) : raw;
      }
      field.setter(value);
    }
    speakConfirmation('All fields filled — take a look before submitting.');
  }, [fields, askField, speakConfirmation]);

  return { runWalkthrough };
}