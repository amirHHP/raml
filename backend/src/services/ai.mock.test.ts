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

describe('mockAi early energy-only story', () => {
  it('turn 1 awaken options cost only energy', () => {
    const res = mockAi('بازیکن تازه چشم‌هایش را باز کرده است.\nنام شخصیت: آرا');
    assert.equal(res.needs_dice_roll, false);
    assertEnergyOnlyOptions(res.options);
    assert.ok(res.options.some((o) => o.text.includes('نور غار')));
  });

  it('turn 2 cave approach asks for luck dice, not strength', () => {
    const res = mockAi(
      'بازیکن این گزینه را انتخاب کرد: «به سوی نور غار برو»\nمکان: کرانه‌های کویر رمل',
    );
    assert.equal(res.needs_dice_roll, true);
    assert.equal(res.required_roll_type, 'luck');
    assert.equal(res.options.length, 0);
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

  it('turn 4 after combat advances instead of looping another dice roll', () => {
    const res = mockAi(
      'مکان: غار اژدهای تاریکی - تالار ورودی\nبازیکن این گزینه را انتخاب کرد: «با تمام توان حمله کن»',
    );
    assert.equal(res.needs_dice_roll, false);
    assertEnergyOnlyOptions(res.options);
    assert.match(res.current_location, /دالان/);
  });

  it('turn 4 retreat path also advances with energy options', () => {
    const res = mockAi(
      'مکان: غار اژدهای تاریکی\nبازیکن این گزینه را انتخاب کرد: «عقب‌نشینی به سایه»',
    );
    assert.equal(res.needs_dice_roll, false);
    assertEnergyOnlyOptions(res.options);
    assert.match(res.story_text, /سایه/);
  });

  it('turn 5+ mock beats change text instead of looping the desert fallback', () => {
    const a = mockAi(
      'بازیکن این گزینه را انتخاب کرد: «ردیابی ردپاها»',
      5,
    );
    const b = mockAi(
      'بازیکن این گزینه را انتخاب کرد: «از طناب پوسیده پایین برو»',
      6,
    );
    assert.notEqual(a.story_text, b.story_text);
    assert.match(a.story_text, /نوبت 5/);
    assertEnergyOnlyOptions(a.options);
    assertEnergyOnlyOptions(b.options);
  });
});
