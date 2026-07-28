import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseAiResponse } from './ai';

describe('parseAiResponse', () => {
  it('accepts string options and defaults them to energy/search', () => {
    const parsed = parseAiResponse(`{
      "story_text": "باد از دهانه غار می وزد.",
      "current_location": "غار",
      "needs_dice_roll": false,
      "options": ["وارد غار شو", "صبر کن"]
    }`);

    assert.equal(parsed.options.length, 2);
    assert.equal(parsed.options[0]?.text, 'وارد غار شو');
    assert.equal(parsed.options[0]?.icon, 'search');
    assert.equal(parsed.options[0]?.condition_check.stat, 'energy');
    assert.equal(parsed.options[0]?.condition_check.min, 0);
  });

  it('coerces numeric strings and fills missing condition_check', () => {
    const parsed = parseAiResponse(`{
      "story_text": "دهانه غار می لرزد.",
      "current_location": "غار",
      "stats_update": { "xp": "5", "energy_change": "-1" },
      "needs_dice_roll": false,
      "options": [{ "text": "پیش برو", "icon": "sword" }]
    }`);

    assert.equal(parsed.stats_update.xp, 5);
    assert.equal(parsed.stats_update.energy_change, -1);
    assert.equal(parsed.options[0]?.condition_check.stat, 'energy');
    assert.equal(parsed.options[0]?.condition_check.min, 0);
  });
});
