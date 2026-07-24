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
  const need = opt.condition_check.min;
  if (need > 0) {
    return `${STAT_LABEL[opt.condition_check.stat]} ${toFaDigits(need)}`;
  }
  const energy = opt.energy_cost ?? 1;
  return `انرژی ${toFaDigits(energy)}`;
}
