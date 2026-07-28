/** Coerce model booleans that arrive as "false", 0, etc. */
export function coerceBool(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
  }
  return fallback;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeOptions(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const record = asRecord(raw);
  if (!record) return [];

  // Single option sent as an object instead of an array.
  if (pickString(record, 'text', 'label', 'option', 'title', 'name', 'description', 'action')) {
    return [record];
  }

  const numericKeys = Object.keys(record).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length > 0) {
    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => record[key]);
  }

  // Named buckets like option_a / choice_1
  return Object.keys(record)
    .filter((key) => /^(option|choice|action)/i.test(key))
    .sort()
    .map((key) => record[key]);
}

function normalizeCondition(raw: unknown): { stat: string; min: number } {
  if (typeof raw === 'string') {
    return { stat: raw.trim() || 'energy', min: 0 };
  }
  const record = asRecord(raw);
  if (!record) return { stat: 'energy', min: 0 };
  const stat =
    typeof record.stat === 'string' && record.stat.trim()
      ? record.stat.trim()
      : 'energy';
  const min = Number(record.min);
  return { stat, min: Number.isFinite(min) ? min : 0 };
}

function normalizeOption(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === 'string') {
    const text = raw.trim();
    return text
      ? {
          text,
          icon: 'search',
          condition_check: { stat: 'energy', min: 0 },
        }
      : null;
  }

  const record = asRecord(raw);
  if (!record) return null;

  const text = pickString(
    record,
    'text',
    'label',
    'option',
    'title',
    'name',
    'description',
    'action',
    'choice',
  );
  if (!text) return null;

  const icon =
    typeof record.icon === 'string' && record.icon.trim()
      ? record.icon.trim()
      : 'search';

  return {
    text,
    icon,
    condition_check: normalizeCondition(record.condition_check ?? record.condition),
  };
}

function normalizeDiscoveredItem(raw: unknown): unknown {
  const record = asRecord(raw);
  if (!record) return null;

  const id = pickString(record, 'id', 'item_id');
  const name = pickString(record, 'name', 'title');
  const description = pickString(record, 'description', 'desc') ?? name;
  if (!id || !name) return null;

  return {
    id,
    name,
    description,
    icon: pickString(record, 'icon') ?? 'amulet',
    equip_slot: record.equip_slot ?? record.equipSlot ?? null,
  };
}

/**
 * Gemma/Gemini often return camelCase keys, string booleans, or option arrays
 * as keyed objects. Normalize before Zod so a live turn does not hard-fail.
 */
export function normalizeAiPayload(raw: unknown): unknown {
  let record = asRecord(raw);
  if (!record) return raw;

  for (const key of ['data', 'result', 'response', 'output', 'game_state', 'gameState']) {
    const nested = asRecord(record[key]);
    if (nested && pickString(nested, 'story_text', 'storyText', 'story')) {
      record = nested;
      break;
    }
  }

  const story_text =
    pickString(record, 'story_text', 'storyText', 'story', 'narrative') ??
    'ادامه می‌دهی...';

  const options = normalizeOptions(
    record.options ??
      record.choices ??
      record.actions ??
      record.action_options ??
      record.actionOptions,
  )
    .map(normalizeOption)
    .filter(Boolean);

  return {
    story_text,
    current_location:
      pickString(record, 'current_location', 'currentLocation', 'location') ??
      'ناشناخته',
    enemy_line_art_type:
      pickString(record, 'enemy_line_art_type', 'enemyLineArtType') ?? 'none',
    stats_update: asRecord(record.stats_update ?? record.statsUpdate) ?? {},
    needs_dice_roll: coerceBool(record.needs_dice_roll ?? record.needsDiceRoll),
    required_roll_type:
      record.required_roll_type ?? record.requiredRollType ?? null,
    min_roll_success: record.min_roll_success ?? record.minRollSuccess ?? null,
    options,
    discovered_item: normalizeDiscoveredItem(
      record.discovered_item ?? record.discoveredItem,
    ),
    toast_message: record.toast_message ?? record.toastMessage ?? null,
  };
}

/** Last-resort choices so a live turn never dead-ends on an empty options array. */
export function fallbackAiOptions(): Array<{
  text: string;
  icon: 'search' | 'talk' | 'shield';
  condition_check: { stat: 'energy'; min: 0 };
}> {
  return [
    {
      text: 'جلو برو',
      icon: 'search',
      condition_check: { stat: 'energy', min: 0 },
    },
    {
      text: 'اطراف را بپای',
      icon: 'search',
      condition_check: { stat: 'energy', min: 0 },
    },
    {
      text: 'لحظه‌ای مکث کن',
      icon: 'shield',
      condition_check: { stat: 'energy', min: 0 },
    },
  ];
}

export function ensureAiOptions<T extends { needs_dice_roll: boolean; options: unknown[] }>(
  parsed: T,
): T {
  if (parsed.needs_dice_roll) {
    parsed.options = [];
    return parsed;
  }
  if (parsed.options.length >= 2) return parsed;
  parsed.options = fallbackAiOptions();
  return parsed;
}
