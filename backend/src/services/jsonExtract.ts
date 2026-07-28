/** Strip optional ```json fences that Gemini and others often wrap around payloads. */
function unwrapMarkdownFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) return fenced[1].trim();

  // Opening fence without a closing one — drop the first line only.
  if (/^```(?:json)?\s*$/im.test(trimmed.split('\n')[0] ?? '')) {
    return trimmed.replace(/^```(?:json)?\s*\n?/i, '').trim();
  }

  return trimmed;
}

/**
 * Walk from the first `{` and return the first balanced JSON object, respecting
 * quoted strings. Greedy `/\{[\s\S]*\}/` breaks when story text contains `}`.
 */
export function sliceFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

/** Parse the first JSON object from a model completion, tolerating prose and fences. */
export function extractJson(raw: string): unknown {
  const text = unwrapMarkdownFence(raw.trim());
  const candidate = sliceFirstJsonObject(text) ?? text;

  try {
    return JSON.parse(candidate);
  } catch (firstErr) {
    // Whole string may be `{...} trailing commentary` — slice again if needed.
    const sliced = sliceFirstJsonObject(text);
    if (sliced && sliced !== candidate) {
      return JSON.parse(sliced);
    }
    throw firstErr instanceof Error ? firstErr : new Error('AI response is not valid JSON');
  }
}
