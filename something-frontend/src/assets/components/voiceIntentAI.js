/**
 * voiceIntentAI.js
 *
 * Fallback intent parser for when the keyword matcher finds nothing.
 * Reuses the SAME /ai/chat endpoint FloatingHelper already calls —
 * no new backend route needed. We just build a system prompt scoped to
 * whatever commands are currently registered, and force strict JSON out.
 */

function buildSystemPrompt(commands) {
  const commandList = commands
    .map((c) => `- id: "${c.id}" | label: "${c.label}" | example phrases: ${c.phrases.join(', ')}`)
    .join('\n');

  return `
You are a voice command intent classifier for Glaukopis, an academic social platform.

The user spoke a command that didn't match any exact phrase. Your ONLY job is to
decide which of the CURRENTLY AVAILABLE commands (if any) they meant, based on
the meaning of what they said — not exact wording.

AVAILABLE COMMANDS (only these are valid targets):
${commandList || '(none currently available)'}

RULES:
- Respond with STRICT JSON only. No markdown, no explanation, no backticks.
- If you're confident the user meant one of the available commands:
  {"action": "command", "target": "<the exact id from the list above>"}
- If nothing above matches, or the list is empty, or you're not confident:
  {"action": "unknown"}
- NEVER invent an id that isn't in the list above.
`.trim();
}

function parseAIResponse(rawText) {
  // strip accidental markdown fences, just in case
  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed?.action === 'command' && typeof parsed.target === 'string') {
      return { action: 'command', target: parsed.target };
    }
    return { action: 'unknown' };
  } catch {
    return { action: 'unknown' };
  }
}

/**
 * parseIntentWithAI
 * @param {string} transcript - what the user said
 * @param {Array} commands - currently registered commands (from getRegisteredCommands())
 * @returns {Promise<{ action: 'command', target: string } | { action: 'unknown' }>}
 */
export async function parseIntentWithAI(transcript, commands) {
  if (!commands.length) return { action: 'unknown' };

  const system = buildSystemPrompt(commands);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: transcript }],
        system,
      }),
    });
    if (!response.ok) throw new Error('AI intent request failed');

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';
    const result = parseAIResponse(rawText);

    // SECURITY/CORRECTNESS: never trust the model's target blindly —
    // it must exist in the CURRENT registry, not just the list we sent it
    // (registry could've changed mid-flight, e.g. user navigated during the request)
    if (result.action === 'command') {
      const stillValid = commands.some((c) => c.id === result.target);
      if (!stillValid) return { action: 'unknown' };
    }

    return result;
  } catch (err) {
    console.error('[voice] AI intent parse failed:', err);
    return { action: 'unknown' };
  }
}