import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockAi } from './ai';

function assertEnergyOnlyOptions(
  options: Array<{ condition_check: { stat: string; min: number } }>,
): void {
  assert.ok(options.length >= 2);
  for (const opt of options) {
    assert.equal(opt.condition_check.stat, 'energy');
    assert.equal(opt.condition_check.min, 0);
  }
}

const AWAKEN_PROMPT = 'بازیکن تازه چشم‌هایش را باز کرده است.\nنام شخصیت: آرا';

describe('mockAi early energy-only story', () => {
  it('turn 1 awaken options cost only energy and hand out a starting item', () => {
    const res = mockAi(AWAKEN_PROMPT, 1);
    assert.equal(res.needs_dice_roll, false);
    assertEnergyOnlyOptions(res.options);
    assert.equal(res.discovered_item?.id, 'sand_amulet');
  });

  it('turn 1 offers three distinct action verbs: force, object, talk', () => {
    const res = mockAi(AWAKEN_PROMPT, 1);
    const icons = res.options.map((o) => o.icon);
    assert.deepEqual(icons, ['sword', 'key', 'talk']);
  });

  it('every turn-1 choice leads to the prologue luck dice', () => {
    for (const option of mockAi(AWAKEN_PROMPT, 1).options) {
      const res = mockAi(
        `بازیکن این گزینه را انتخاب کرد: «${option.text}»\nمکان: کویر رمل`,
        2,
      );
      assert.equal(res.needs_dice_roll, true, option.text);
      assert.equal(res.required_roll_type, 'luck');
      assert.equal(res.options.length, 0);
    }
  });

  it('the prologue dice is winnable on most rolls', () => {
    const res = mockAi('بازیکن این گزینه را انتخاب کرد: «دست به سوی فانوس دراز کن»', 2);
    assert.ok(
      res.min_roll_success != null && res.min_roll_success <= 8,
      'first dice check should favour the player',
    );
  });

  it('each turn-1 choice is echoed back in the dice setup text', () => {
    const lantern = mockAi('بازیکن این گزینه را انتخاب کرد: «دست به سوی فانوس دراز کن»', 2);
    const shout = mockAi('بازیکن این گزینه را انتخاب کرد: «فریاد بزن: تو کیستی؟»', 2);
    assert.notEqual(lantern.story_text, shout.story_text);
    assert.match(lantern.story_text, /فانوس/);
    assert.match(shout.story_text, /گوش/);
  });

  it('turn 3 failed dice offers energy-only choices (no mana/strength/agility)', () => {
    const res = mockAi(
      'نتیجهٔ تاس مهارت:\nنتیجه: شکست\nمکان: غار اژدهای تاریکی',
    );
    assert.equal(res.needs_dice_roll, false);
    assertEnergyOnlyOptions(res.options);
    assert.ok(res.options.some((o) => o.text.includes('طلسم شن')));
    assert.ok(res.options.every((o) => o.condition_check.stat !== 'mana'));
    assert.ok(res.options.every((o) => o.condition_check.stat !== 'strength'));
    assert.ok(res.options.every((o) => o.condition_check.stat !== 'agility'));
  });

  it('turn 3 success dice offers energy-only progress options', () => {
    const res = mockAi(
      'نتیجهٔ تاس مهارت:\nنتیجه: موفقیت\nمکان: غار اژدهای تاریکی',
    );
    assertEnergyOnlyOptions(res.options);
    assert.ok(res.options.some((o) => o.text.includes('شکاف')));
  });

  it('turn 4 presents ancient chest with 4 character class choices', () => {
    const res = mockAi(
      'مکان: غار اژدهای تاریکی - تالار ورودی\nبازیکن این گزینه را انتخاب کرد: «با تمام توان حمله کن»',
      4,
    );
    assert.equal(res.needs_dice_roll, false);
    assert.equal(res.options.length, 4);
    assertEnergyOnlyOptions(res.options);
    assert.match(res.story_text, /صندوق/);
    assert.ok(res.options.some((o) => o.text.includes('جنگجو')));
    assert.ok(res.options.some((o) => o.text.includes('جادوگر')));
    assert.ok(res.options.some((o) => o.text.includes('راهزن')));
    assert.ok(res.options.some((o) => o.text.includes('شکارچی')));
  });

  it('turn 5 choice sets class type and applies stats bonuses', () => {
    const res = mockAi(
      'بازیکن این گزینه را انتخاب کرد: «برداشتن شمشیر سنگین (مسیر جنگجو — قدرت بالا & جان افزون)»',
      5,
    );
    assert.equal(res.needs_dice_roll, false);
    assert.match(res.story_text, /جنگجو/);
    assert.equal(res.stats_update?.strength, 5);
    assert.equal(res.stats_update?.hp, 20);
  });
});
