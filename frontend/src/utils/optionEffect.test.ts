import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { optionEffectLabel } from './optionEffect.ts';
import type { GameOption } from '../types/game.ts';

function opt(partial: Partial<GameOption> & Pick<GameOption, 'condition_check'>): GameOption {
  return {
    id: '1',
    text: 'تست',
    icon: 'search',
    ...partial,
  };
}

describe('optionEffectLabel', () => {
  it('uses condition when min > 0', () => {
    assert.equal(
      optionEffectLabel(
        opt({ condition_check: { stat: 'intellect', min: 1 } }),
      ),
      'خرد ۱',
    );
  });

  it('falls back to energy cost when no condition min', () => {
    assert.equal(
      optionEffectLabel(
        opt({ condition_check: { stat: 'energy', min: 0 }, energy_cost: 2 }),
      ),
      'انرژی ۲',
    );
  });
});
