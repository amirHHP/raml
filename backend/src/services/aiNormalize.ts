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

import type { StatKey } from '../types/game';

const STAT_MAP: Record<string, StatKey> = {
  hp: 'hp',
  health: 'hp',
  life: 'hp',
  stamina: 'hp',
  'جان': 'hp',
  'سلامت': 'hp',
  'خون': 'hp',
  mana: 'mana',
  mp: 'mana',
  magic: 'mana',
  'مانا': 'mana',
  'جادو': 'mana',
  gold: 'gold',
  coin: 'gold',
  coins: 'gold',
  money: 'gold',
  'طلا': 'gold',
  'سکه': 'gold',
  'پول': 'gold',
  energy: 'energy',
  en: 'energy',
  'انرژی': 'energy',
  strength: 'strength',
  str: 'strength',
  power: 'strength',
  'قدرت': 'strength',
  'زور': 'strength',
  agility: 'agility',
  agi: 'agility',
  dex: 'agility',
  speed: 'agility',
  'چابکی': 'agility',
  'سرعت': 'agility',
  intellect: 'intellect',
  int: 'intellect',
  intelligence: 'intellect',
  wis: 'intellect',
  wisdom: 'intellect',
  'خرد': 'intellect',
  'هوش': 'intellect',
  'علم': 'intellect',
};

export function normalizeStatKey(raw: unknown): StatKey {
  if (typeof raw !== 'string') return 'energy';
  const key = raw.trim().toLowerCase();
  return STAT_MAP[key] || 'energy';
}

function normalizeCondition(raw: unknown): { stat: StatKey; min: number } {
  if (typeof raw === 'string') {
    return { stat: normalizeStatKey(raw), min: 0 };
  }
  const record = asRecord(raw);
  if (!record) return { stat: 'energy', min: 0 };
  const stat = normalizeStatKey(record.stat);
  const min = Number(record.min);
  return { stat, min: Number.isFinite(min) && min >= 0 ? min : 0 };
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

const RAW_ICON_TO_EMOJI: Record<string, string> = {
  amulet: '📿',
  pendant: '📿',
  necklace: '📿',
  talisman: '📿',
  sword: '🗡️',
  dagger: '🗡️',
  blade: '⚔️',
  weapon: '⚔️',
  shield: '🛡️',
  armor: '🛡️',
  chest: '🛡️',
  helmet: '🪖',
  head: '🪖',
  boots: '🥾',
  feet: '🥾',
  gloves: '🥊',
  hands: '🥊',
  ring: '💍',
  potion: '🧪',
  elixir: '🧪',
  flask: '🧪',
  scroll: '📜',
  map: '🗺️',
  book: '📖',
  key: '🔑',
  gem: '💎',
  crystal: '💎',
  gold: '🪙',
  search: '🔍',
  backpack: '🎒',
};

function normalizeDiscoveredItem(raw: unknown): unknown {
  const record = asRecord(raw);
  if (!record) return null;

  const id = pickString(record, 'id', 'item_id');
  let name = pickString(record, 'name', 'title');
  const description = pickString(record, 'description', 'desc') ?? name;
  if (!id || !name) return null;

  const rawIcon = pickString(record, 'icon');
  let icon = '🎒';

  if (rawIcon) {
    if (/\p{Extended_Pictographic}/u.test(rawIcon)) {
      icon = rawIcon;
    } else {
      const slug = rawIcon.trim().toLowerCase();
      icon = RAW_ICON_TO_EMOJI[slug] || '🎒';
      if (name.toLowerCase().startsWith(slug + ' ')) {
        name = name.slice(slug.length).trim();
      }
    }
  } else {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('طلسم') || lowerName.includes('amulet')) icon = '📿';
    else if (lowerName.includes('شمشیر') || lowerName.includes('sword')) icon = '🗡️';
    else if (lowerName.includes('سپر') || lowerName.includes('shield')) icon = '🛡️';
    else if (lowerName.includes('معجون') || lowerName.includes('potion')) icon = '🧪';
  }

  return {
    id,
    name,
    description,
    icon,
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
    ascii_art:
      pickString(
        record,
        'ascii_art',
        'asciiArt',
        'line_art',
        'character_art',
        'text_art',
        'ascii',
      ) ?? null,
    svg_art:
      pickString(
        record,
        'svg_art',
        'svgArt',
        'svg_code',
        'svg',
      ) ?? null,
    image_prompt:
      pickString(
        record,
        'image_prompt',
        'imagePrompt',
        'visual_prompt',
        'prompt',
      ) ?? null,
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
