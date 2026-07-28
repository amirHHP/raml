import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, sliceFirstJsonObject } from './jsonExtract';

describe('sliceFirstJsonObject', () => {
  it('returns the first balanced object when prose trails the JSON', () => {
    const raw = '{"story_text":"سلام","options":[]} این توضیح اضافه است';
    assert.equal(sliceFirstJsonObject(raw), '{"story_text":"سلام","options":[]}');
  });

  it('does not stop at a brace inside a quoted string', () => {
    const raw = '{"story_text":"با } داخل متن","options":[]}';
    assert.equal(sliceFirstJsonObject(raw), raw);
  });

  it('ignores prose before the opening brace', () => {
    const raw = 'البته! {"ok":true}';
    assert.equal(sliceFirstJsonObject(raw), '{"ok":true}');
  });
});

describe('extractJson', () => {
  it('parses plain JSON', () => {
    assert.deepEqual(extractJson('{"story_text":"آزمون"}'), { story_text: 'آزمون' });
  });

  it('parses JSON followed by trailing commentary (the live-AI failure mode)', () => {
    const payload = {
      story_text: 'چشم باز می‌کنی.',
      options: [],
    };
    const raw = `${JSON.stringify(payload)} — ادامهٔ توضیح مدل`;
    assert.deepEqual(extractJson(raw), payload);
  });

  it('unwraps markdown fences', () => {
    const raw = '```json\n{"story_text":"داخل فنس"}\n```';
    assert.deepEqual(extractJson(raw), { story_text: 'داخل فنس' });
  });

  it('handles a brace inside story text plus trailing prose with another brace', () => {
    const inner = '{"story_text":"نقطه } وسط","options":[]}';
    const raw = `${inner} یادداشت: }`;
    assert.deepEqual(extractJson(raw), JSON.parse(inner));
  });
});
