import test, { describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { awakenPlayer, getOrCreatePlayer, setUseMemory, updatePlayerLanguage } from './gameState';
import { setGameSettingsMemory } from './gameSettings';
import { setAiSettingsMemory, updateAiSettings } from './aiSettings';
import { setPromptServiceMemory, ensurePromptSeeds } from './promptService';
import { setMilestonePromptMemory, ensureMilestoneSeeds } from './milestonePromptService';
import { mockAiEn } from './ai';

describe('English Language Support', () => {
  before(async () => {
    setUseMemory(true);
    setGameSettingsMemory(true);
    setAiSettingsMemory(true);
    setPromptServiceMemory(true);
    setMilestonePromptMemory(true);
    await ensurePromptSeeds();
    await ensureMilestoneSeeds();
    await updateAiSettings({ useMockAi: true });
  });

  test('creates new player with default Persian language', async () => {
    const player = await getOrCreatePlayer('test-device-lang-1');
    assert.equal(player.language, 'fa');
    assert.equal(player.currentLocation, 'تاریکی مطلق');
  });

  test('updates player language and initial state before awaken', async () => {
    const state = await updatePlayerLanguage('test-device-lang-1', 'en');
    assert.equal(state.language, 'en');
    assert.equal(state.currentLocation, 'Absolute Darkness');
    assert.equal(state.storyText.includes('Absolute darkness'), true);
  });

  test('awakens player in English mode with English mock responses', async () => {
    const state = await awakenPlayer('test-device-lang-2', 'Hero', 'warrior', 'en');
    assert.equal(state.language, 'en');
    assert.equal(state.characterName, 'Hero');
    assert.equal(state.awakened, true);
    assert.equal(state.storyText.includes('You open your eyes'), true);
    assert.equal(state.currentLocation, 'Raml Desert — Sand Pit');
    assert.equal(state.options.length > 0, true);
    assert.equal(state.options[0].text.includes('Pull yourself out'), true);
  });

  test('mockAiEn returns English responses for turn 1 awaken', () => {
    const res = mockAiEn('opened their eyes', 1);
    assert.equal(res.story_text.includes('You open your eyes'), true);
    assert.equal(res.current_location, 'Raml Desert — Sand Pit');
    assert.equal(res.options[0].text.includes('Pull yourself out'), true);
    assert.equal(res.toast_message, 'New Item: Sand Amulet');
  });

  test('mockAiEn returns English responses for dice result', () => {
    const resSuccess = mockAiEn('Skill check result ... Result: Success', 3);
    assert.equal(resSuccess.story_text.includes('dice roll in your favor'), true);

    const resFail = mockAiEn('Skill check result ... Result: Failure', 3);
    assert.equal(resFail.story_text.includes('dice betray you'), true);
  });
});
