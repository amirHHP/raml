import type { StatKey } from '../types/game';

const STAT_SYNONYMS: Record<string, StatKey> = {
  خرد: 'intellect',
  هوش: 'intellect',
  intellect: 'intellect',
  wisdom: 'intellect',
  wis: 'intellect',
  قدرت: 'strength',
  زور: 'strength',
  strength: 'strength',
  str: 'strength',
  چابکی: 'agility',
  سرعت: 'agility',
  agility: 'agility',
  agi: 'agility',
  dex: 'agility',
  جان: 'hp',
  سلامت: 'hp',
  خون: 'hp',
  hp: 'hp',
  health: 'hp',
  مانا: 'mana',
  جادو: 'mana',
  mana: 'mana',
  mp: 'mana',
  طلا: 'gold',
  سکه: 'gold',
  gold: 'gold',
  coin: 'gold',
};

/** Convert Persian/Arabic digits (۰-۹) to standard ASCII digits (0-9). */
export function toEnDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * Parse text like "+۳ خرد", "+3 intellect", "قدرت +۵", "چابکی +۳، خرد +۲", "+30 مانا"
 * into a key-value record of stat changes.
 */
export function parseItemStatEffect(
  effect?: string | null,
): Partial<Record<StatKey, number>> {
  if (!effect || typeof effect !== 'string') return {};
  const normalized = toEnDigits(effect);
  const result: Partial<Record<StatKey, number>> = {};

  // Match: STAT (+/-)NUM e.g., "خرد +3", "قدرت +5", "چابکی +۳"
  const patternStatFirst =
    /([\u0600-\u06FFa-zA-Z]+)\s*([\+\-]?)\s*(\d+)/g;
  let match: RegExpExecArray | null;
  while ((match = patternStatFirst.exec(normalized)) !== null) {
    const statWord = match[1].toLowerCase();
    const statKey = STAT_SYNONYMS[statWord];
    if (statKey) {
      const sign = match[2] === '-' ? -1 : 1;
      const val = Number(match[3]) * sign;
      if (Number.isFinite(val)) {
        result[statKey] = (result[statKey] || 0) + val;
      }
    }
  }

  // Match: (+/-)NUM STAT e.g., "+3 خرد", "+30 مانا", "+5 strength"
  const patternNumFirst =
    /([\+\-]?)\s*(\d+)\s*([\u0600-\u06FFa-zA-Z]+)/g;
  while ((match = patternNumFirst.exec(normalized)) !== null) {
    const statWord = match[3].toLowerCase();
    const statKey = STAT_SYNONYMS[statWord];
    if (statKey && result[statKey] === undefined) {
      const sign = match[1] === '-' ? -1 : 1;
      const val = Number(match[2]) * sign;
      if (Number.isFinite(val)) {
        result[statKey] = (result[statKey] || 0) + val;
      }
    }
  }

  return result;
}
