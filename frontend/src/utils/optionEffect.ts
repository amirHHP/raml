import type { GameOption, StatKey } from '../types/game';
import { toFaDigits } from './formatCountdown';

const STAT_LABEL: Record<StatKey, string> = {
  hp: 'جان',
  mana: 'مانا',
  gold: 'طلا',
  energy: 'انرژی',
  strength: 'قدرت',
  agility: 'چابکی',
  intellect: 'خرد',
};

/** Label shown on action cards and beside a locked-in choice. */
export function optionEffectLabel(opt: GameOption): string {
  let baseStr = '';
  const need = opt.condition_check.min;
  if (need > 0) {
    const label = STAT_LABEL[opt.condition_check.stat] || 'انرژی';
    baseStr = `${label} ${toFaDigits(need)}`;
  } else {
    const energy = opt.energy_cost ?? 1;
    baseStr = `انرژی ${toFaDigits(energy)}`;
  }

  if (opt.item_reward) {
    return `${baseStr} • 🎒 + ${opt.item_reward}`;
  }
  if (opt.requires_item) {
    return `${baseStr} • 🛡️ نیاز به ${opt.requires_item}`;
  }
  return baseStr;
}
