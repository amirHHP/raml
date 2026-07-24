import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { joinWordParts, splitWords } from './useWordTypewriter.ts';

describe('splitWords', () => {
  it('splits Persian words on spaces', () => {
    assert.deepEqual(splitWords('تاریکی مطلق. سکوت سنگین.'), [
      'تاریکی',
      'مطلق.',
      'سکوت',
      'سنگین.',
    ]);
  });

  it('keeps newline runs', () => {
    assert.deepEqual(splitWords('یک\n\nدو'), ['یک', '\n\n', 'دو']);
  });
});

describe('joinWordParts', () => {
  it('rejoins words with spaces and preserves newlines', () => {
    assert.equal(
      joinWordParts(['تاریکی', 'مطلق.', '\n\n', 'نام']),
      'تاریکی مطلق.\n\nنام',
    );
  });
});
