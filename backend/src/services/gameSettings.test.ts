import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampStoryMsPerWord,
  clearGameSettingsCache,
  DEFAULT_STORY_MS_PER_WORD,
  getPublicGameSettings,
  getStoryMsPerWord,
  MAX_STORY_MS_PER_WORD,
  MIN_STORY_MS_PER_WORD,
  setGameSettingsMemory,
  updateGameSettings,
} from './gameSettings';

describe('clampStoryMsPerWord', () => {
  it('clamps to min/max and rounds', () => {
    assert.equal(clampStoryMsPerWord(10), MIN_STORY_MS_PER_WORD);
    assert.equal(clampStoryMsPerWord(99999), MAX_STORY_MS_PER_WORD);
    assert.equal(clampStoryMsPerWord(350.6), 351);
  });

  it('falls back for non-finite', () => {
    assert.equal(clampStoryMsPerWord(Number.NaN), DEFAULT_STORY_MS_PER_WORD);
  });
});

describe('game settings (memory)', () => {
  before(() => {
    setGameSettingsMemory(true);
    clearGameSettingsCache();
  });

  it('defaults then updates storyMsPerWord and unlock turns', async () => {
    clearGameSettingsCache();
    const initial = await getPublicGameSettings();
    assert.equal(initial.storyMsPerWord, DEFAULT_STORY_MS_PER_WORD);
    assert.equal(getStoryMsPerWord(), DEFAULT_STORY_MS_PER_WORD);
    assert.equal(initial.unlockInventoryAtTurn, 1);
    assert.equal(initial.unlockGoldAtTurn, 40);

    const updated = await updateGameSettings({
      storyMsPerWord: 250,
      unlockGoldAtTurn: 15,
    });
    assert.equal(updated.storyMsPerWord, 250);
    assert.equal(getStoryMsPerWord(), 250);
    assert.equal(updated.unlockGoldAtTurn, 15);
    assert.equal(updated.unlockInventoryAtTurn, 1);
  });
});
