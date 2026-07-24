import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  getOrCreatePlayer,
  normalizeSaveCode,
  restorePlayer,
  setUseMemory,
} from './gameState';

describe('normalizeSaveCode', () => {
  it('trims whitespace', () => {
    assert.equal(normalizeSaveCode('  abc-123  '), 'abc-123');
  });
});

describe('restorePlayer (memory)', () => {
  before(() => {
    setUseMemory(true);
  });

  it('rejects short codes', async () => {
    await assert.rejects(() => restorePlayer('short'), (err: Error & { status?: number }) => {
      assert.equal(err.status, 400);
      return true;
    });
  });

  it('returns 404 for unknown codes', async () => {
    await assert.rejects(
      () => restorePlayer('unknown-save-code-xyz'),
      (err: Error & { status?: number }) => {
        assert.equal(err.status, 404);
        return true;
      },
    );
  });

  it('restores an existing awakened player', async () => {
    const deviceId = 'restore-test-device-001';
    const player = await getOrCreatePlayer(deviceId);
    player.characterName = 'مسافر';
    player.awakened = true;

    const state = await restorePlayer(`  ${deviceId}  `);
    assert.equal(state.deviceId, deviceId);
    assert.equal(state.awakened, true);
    assert.equal(state.characterName, 'مسافر');
  });
});
