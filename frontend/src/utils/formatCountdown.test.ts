import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatEnergyCountdown, toFaDigits } from './formatCountdown.ts';

describe('toFaDigits', () => {
  it('maps ASCII digits to Persian', () => {
    assert.equal(toFaDigits(12), '۱۲');
    assert.equal(toFaDigits('09'), '۰۹');
  });
});

describe('formatEnergyCountdown', () => {
  it('formats full minutes and seconds', () => {
    assert.equal(formatEnergyCountdown(20 * 60 * 1000), '۲۰:۰۰');
    assert.equal(formatEnergyCountdown(65_000), '۱:۰۵');
  });

  it('ceils partial seconds', () => {
    assert.equal(formatEnergyCountdown(1), '۰:۰۱');
    assert.equal(formatEnergyCountdown(0), '۰:۰۰');
  });

  it('clamps negative values', () => {
    assert.equal(formatEnergyCountdown(-500), '۰:۰۰');
  });
});
