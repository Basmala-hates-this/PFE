import { useCallback } from 'react';
import { useVoiceCommandContext } from '../components/VoiceCommandContext.jsx';

const CONTROL_WORDS = {
  skip: ['skip', 'passer', 'تخطي'],
  cancel: ['cancel', 'annuler', 'إلغاء'],
  back: ['back', 'previous', 'retour', 'رجوع'],
  done: ['done', 'finished', "that's all", 'terminé', 'انتهيت'],
  yes: ['yes', 'yeah', 'yep', 'correct', 'oui', 'نعم'],
  no: ['no', 'nope', 'wrong', 'non', 'لا'],
};
const matchesControl = (text, key) =>
  CONTROL_WORDS[key].some((w) => text.trim().toLowerCase() === w);

/**
 * `fieldsOrFn`: static array, or (answers) => array — called fresh after
 * every answer so later fields can depend on earlier ones (e.g. major
 * options depend on role) without reading React state mid-walkthrough.
 *
 * Field shape: { id, label, setter, validate?, normalize?, multi?, confirm? }
 * - confirm: true speaks the (normalized) value back and requires a
 *   spoken "yes" before it's accepted — for error-prone fields like email.
 */
export function useGuidedFormFill(fieldsOrFn) {
  const { startDictation, stopDictation, speakConfirmation } = useVoiceCommandContext();

  const askOnce = useCallback((prompt) => {
    return new Promise((resolve) => {
      speakConfirmation(prompt);
      startDictation(prompt, (raw) => {
        stopDictation();
        resolve(raw);
      });
    });
  }, [startDictation, stopDictation, speakConfirmation]);

  const askYesNo = useCallback(async (prompt) => {
    const raw = await askOnce(prompt);
    return matchesControl(raw, 'yes'); // treat anything not a clear "yes" as no — safer default for confirmation
  }, [askOnce]);

  const askSingle = useCallback(async (field) => {
    while (true) {
      let raw = await askOnce(`What's your ${field.label}?`);
      if (matchesControl(raw, 'skip') || matchesControl(raw, 'cancel') || matchesControl(raw, 'back')) {
        return raw; // control words pass straight through, no validation/confirm
      }

      let value = field.normalize ? field.normalize(raw) : raw;
      if (field.validate && !field.validate(value)) {
        speakConfirmation(`That didn't sound right for ${field.label} — let's try again.`);
        continue; // re-ask from scratch
      }

      if (field.confirm) {
        const ok = await askYesNo(`I heard ${value} for ${field.label}. Is that right?`);
        if (!ok) {
          speakConfirmation("Let's try that again.");
          continue;
        }
      }
      return value; // already normalized — caller shouldn't re-normalize
    }
  }, [askOnce, askYesNo, speakConfirmation]);

  const askMulti = useCallback(async (field) => {
    const values = [];
    let raw = await askOnce(`What's your ${field.label}? Say "done" when finished.`);
    while (!matchesControl(raw, 'done') && !matchesControl(raw, 'cancel') && !matchesControl(raw, 'back')) {
      if (!matchesControl(raw, 'skip')) values.push(field.normalize ? field.normalize(raw) : raw);
      raw = await askOnce(`Anything else for ${field.label}, or say "done"?`);
    }
    return { raw, values };
  }, [askOnce]);

  const runWalkthrough = useCallback(async () => {
    const answers = {}; // accumulator — never read React state mid-run, only this
    let fields = typeof fieldsOrFn === 'function' ? fieldsOrFn(answers) : fieldsOrFn;
    let i = 0;

    while (i < fields.length) {
      const field = fields[i];

      if (field.multi) {
        const { raw, values } = await askMulti(field);
        if (matchesControl(raw, 'cancel')) { speakConfirmation('Okay, cancelled.'); return; }
        if (matchesControl(raw, 'back') && i > 0) { i--; continue; }
        field.setter(values);
        answers[field.id] = values;
      } else {
        const result = await askSingle(field);
        if (matchesControl(result, 'cancel')) { speakConfirmation('Okay, cancelled.'); return; }
        if (matchesControl(result, 'skip')) { i++; continue; }
        if (matchesControl(result, 'back') && i > 0) { i--; continue; }
        field.setter(result);
        answers[field.id] = result;
      }

      if (typeof fieldsOrFn === 'function') fields = fieldsOrFn(answers); // recompute now that answer landed
      i++;
    }
    speakConfirmation('All set — take a look before submitting.');
  }, [fieldsOrFn, askSingle, askMulti, speakConfirmation]);

  return { runWalkthrough };
}