import type { GameState } from '../types/game';

/** Clamped 0..100 fill percent for a stat bar. */
export function barPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)));
}

export interface UnlockMilestone {
  key: 'inventory' | 'hp' | 'mana' | 'gold';
  label: string;
  turn: number;
  unlocked: boolean;
}

/** Feature unlock milestones in reveal order, for the "seals" section. */
export function listUnlockMilestones(
  unlocks: GameState['featureUnlocks'],
  turns: GameState['unlockTurns'],
): UnlockMilestone[] {
  return [
    {
      key: 'inventory' as const,
      label: 'کوله‌پشتی',
      turn: turns.unlockInventoryAtTurn,
      unlocked: unlocks.inventory,
    },
    { key: 'hp' as const, label: 'جان', turn: turns.unlockHpAtTurn, unlocked: unlocks.hp },
    {
      key: 'mana' as const,
      label: 'مانا',
      turn: turns.unlockManaAtTurn,
      unlocked: unlocks.mana,
    },
    {
      key: 'gold' as const,
      label: 'طلا',
      turn: turns.unlockGoldAtTurn,
      unlocked: unlocks.gold,
    },
  ].sort((a, b) => a.turn - b.turn);
}
