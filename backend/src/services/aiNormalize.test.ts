import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ensureAiOptions, normalizeAiPayload } from './aiNormalize';
import { parseAiResponse } from './ai';

describe('normalizeAiPayload', () => {
  it('unwraps nested response objects and camelCase keys', () => {
    const normalized = normalizeAiPayload({
      response: {
        storyText: 'باد می وزد.',
        currentLocation: 'غار',
        needsDiceRoll: 'false',
        options: {
          '0': { label: 'پیش برو', icon: 'sword', condition: 'energy' },
          '1': 'صبر کن',
        },
      },
    }) as Record<string, unknown>;

    assert.equal(normalized.story_text, 'باد می وزد.');
    assert.equal(normalized.current_location, 'غار');
    assert.equal(normalized.needs_dice_roll, false);
    assert.deepEqual(normalized.options, [
      {
        text: 'پیش برو',
        icon: 'sword',
        condition_check: { stat: 'energy', min: 0 },
      },
      {
        text: 'صبر کن',
        icon: 'search',
        condition_check: { stat: 'energy', min: 0 },
      },
    ]);
  });

  it('drops incomplete discovered_item instead of failing the whole payload', () => {
    const normalized = normalizeAiPayload({
      story_text: 'ادامه',
      discovered_item: { name: 'بدون id' },
    }) as Record<string, unknown>;

    assert.equal(normalized.discovered_item, null);
  });

  it('ensureAiOptions injects fallbacks when options are empty', () => {
    const parsed = {
      needs_dice_roll: false,
      options: [] as unknown[],
    };
    ensureAiOptions(parsed);
    assert.equal(parsed.options.length, 3);
    assert.equal((parsed.options[0] as { text: string }).text, 'جلو برو');
  });

  it('ensureAiOptions leaves dice-roll turns with no options', () => {
    const parsed = {
      needs_dice_roll: true,
      options: [{ text: 'ignored' }] as unknown[],
    };
    ensureAiOptions(parsed);
    assert.deepEqual(parsed.options, []);
  });
});

describe('parseAiResponse live-model quirks', () => {
  it('parses gemma-style camelCase payloads end-to-end', () => {
    const parsed = parseAiResponse(`{
      "storyText": "چشم باز می‌کنی.",
      "currentLocation": "غار",
      "needsDiceRoll": "false",
      "options": [
        { "label": "جلو برو", "icon": "sword", "condition": { "stat": "energy", "min": "0" } },
        "فرار کن"
      ]
    }`);

    assert.equal(parsed.story_text, 'چشم باز می‌کنی.');
    assert.equal(parsed.options.length, 2);
    assert.equal(parsed.options[0]?.text, 'جلو برو');
  });

  it('normalizes Farsi and English stat aliases in condition checks', () => {
    const normalized = normalizeAiPayload({
      story_text: 'آزمایش',
      options: [
        { text: 'ضربه بزن', condition_check: { stat: 'قدرت', min: 4 } },
        { text: 'جادو بخوان', condition_check: { stat: 'str', min: 3 } },
        { text: 'فرار کن', condition_check: { stat: 'چابکی', min: 2 } },
      ],
    }) as Record<string, any>;

    assert.equal(normalized.options[0].condition_check.stat, 'strength');
    assert.equal(normalized.options[1].condition_check.stat, 'strength');
    assert.equal(normalized.options[2].condition_check.stat, 'agility');
  });
});
