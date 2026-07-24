import { config } from '../config';
import type { IPlayer } from '../models/Player';
import type { PlayerStats } from '../types/game';

/** Apply passive energy regeneration based on elapsed time. */
export function regenerateEnergy(player: IPlayer): boolean {
  const now = Date.now();
  const last = new Date(player.lastEnergyAt).getTime();
  const intervalMs = config.energyRegenMinutes * 60 * 1000;
  const elapsed = now - last;

  if (elapsed < intervalMs) return false;

  const gained = Math.floor(elapsed / intervalMs);
  if (gained <= 0) return false;

  const maxEnergy = player.stats.maxEnergy || config.energyMax;
  const before = player.stats.energy;
  player.stats.energy = Math.min(maxEnergy, before + gained);
  player.lastEnergyAt = new Date(last + gained * intervalMs);

  return player.stats.energy !== before;
}

export function canSpendEnergy(stats: PlayerStats, cost = 1): boolean {
  return stats.energy >= cost;
}

export function spendEnergy(player: IPlayer, cost = 1): boolean {
  if (!canSpendEnergy(player.stats, cost)) return false;
  player.stats.energy -= cost;
  return true;
}

export function refillEnergy(player: IPlayer, amount: number): void {
  const maxEnergy = player.stats.maxEnergy || config.energyMax;
  player.stats.energy = Math.min(maxEnergy, player.stats.energy + amount);
  player.lastEnergyAt = new Date();
}

export function msUntilNextEnergy(player: IPlayer): number {
  if (player.stats.energy >= player.stats.maxEnergy) return 0;
  const intervalMs = config.energyRegenMinutes * 60 * 1000;
  const last = new Date(player.lastEnergyAt).getTime();
  const nextAt = last + intervalMs;
  return Math.max(0, nextAt - Date.now());
}