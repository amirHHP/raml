import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { assertValidSaveCode, normalizeSaveCode } from './saveCode.ts';

describe('normalizeSaveCode', () => {
  it('trims whitespace', () => {
    assert.equal(normalizeSaveCode('  abc-123  '), 'abc-123');
  });
});

describe('assertValidSaveCode', () => {
  it('returns trimmed valid codes', () => {
    assert.equal(assertValidSaveCode('  save-code-ok  '), 'save-code-ok');
  });

  it('rejects short codes', () => {
    assert.throws(() => assertValidSaveCode('short'), /نامعتبر/);
  });
});
