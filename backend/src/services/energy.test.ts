import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canSpendEnergy,
  regenerateEnergy,
  refillEnergy,
  spendEnergy,
} from '../services/energy';
import type { IPlayer } from '../models/Player';
import { config } from '../config';

function makePlayer(energy = 5): IPlayer {
  return {
    stats: {
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50,
      gold: 0,
      energy,
      maxEnergy: config.energyMax,
      strength: 3,
      agility: 2,
      intellect: 2,
      xp: 0,
      level: 1,
    },
    lastEnergyAt: new Date(Date.now() - config.energyRegenMinutes * 60 * 1000 * 2),
  } as IPlayer;
}

describe('energy service', () => {
  it('spends energy when available', () => {
    const p = makePlayer(3);
    assert.equal(canSpendEnergy(p.stats, 1), true);
    assert.equal(spendEnergy(p, 1), true);
    assert.equal(p.stats.energy, 2);
  });

  it('blocks spend when empty', () => {
    const p = makePlayer(0);
    assert.equal(spendEnergy(p, 1), false);
    assert.equal(p.stats.energy, 0);
  });

  it('regenerates based on elapsed intervals', () => {
    const p = makePlayer(3);
    const changed = regenerateEnergy(p);
    assert.equal(changed, true);
    assert.equal(p.stats.energy, 5);
  });

  it('refills without exceeding max', () => {
    const p = makePlayer(8);
    refillEnergy(p, 5);
    assert.equal(p.stats.energy, config.energyMax);
  });
});
