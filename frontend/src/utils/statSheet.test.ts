import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { barPercent, listUnlockMilestones } from './statSheet.ts';

describe('barPercent', () => {
  it('maps value/max to a rounded percent', () => {
    assert.equal(barPercent(50, 100), 50);
    assert.equal(barPercent(1, 3), 33);
  });

  it('clamps out-of-range values', () => {
    assert.equal(barPercent(-5, 100), 0);
    assert.equal(barPercent(140, 100), 100);
  });

  it('returns 0 for unusable maximums', () => {
    assert.equal(barPercent(10, 0), 0);
    assert.equal(barPercent(10, Number.NaN), 0);
  });
});

describe('listUnlockMilestones', () => {
  const turns = {
    unlockInventoryAtTurn: 10,
    unlockStatsAtTurn: 20,
    unlockHpAtTurn: 20,
    unlockManaAtTurn: 30,
    unlockGoldAtTurn: 40,
  };

  it('orders milestones by turn and carries unlocked state', () => {
    const rows = listUnlockMilestones(
      { inventory: true, stats: true, hp: true, mana: false, gold: false },
      turns,
    );
    assert.deepEqual(
      rows.map((r) => r.key),
      ['inventory', 'hp', 'mana', 'gold'],
    );
    assert.deepEqual(
      rows.map((r) => r.unlocked),
      [true, true, false, false],
    );
  });

  it('sorts by turn even when thresholds are reordered', () => {
    const rows = listUnlockMilestones(
      { inventory: false, stats: false, hp: false, mana: false, gold: false },
      { ...turns, unlockGoldAtTurn: 5 },
    );
    assert.equal(rows[0]!.key, 'gold');
    assert.equal(rows[0]!.turn, 5);
  });
});
