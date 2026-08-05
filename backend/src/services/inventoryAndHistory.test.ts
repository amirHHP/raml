import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  setUseMemory,
  awakenPlayer,
  chooseOption,
} from './gameState';
import { setGameSettingsMemory } from './gameSettings';
import { setAiSettingsMemory, updateAiSettings } from './aiSettings';
import { setPromptServiceMemory, ensurePromptSeeds } from './promptService';
import { setMilestonePromptMemory, ensureMilestoneSeeds } from './milestonePromptService';

describe('Inventory & History Preservation', () => {
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

  it('adds discovered items with descriptions and effects to inventory upon awakening', async () => {
    const state = await awakenPlayer('test-device-inv-1', 'قهرمان');

    assert.equal(state.inventory.length, 1);
    assert.equal(state.inventory[0].name, 'طلسم شن');
    assert.ok(state.inventory[0].description.length > 0);
    assert.ok(state.inventory[0].effect?.includes('روشنایی'));
  });

  it('preserves chosen option bubbles alongside story in history', async () => {
    const awakenState = await awakenPlayer('test-device-hist-1', 'مسافر');
    const firstOptionId = awakenState.options[0].id;

    const state = await chooseOption('test-device-hist-1', firstOptionId);
    const history = state.storyHistory;
    assert.ok(history.length >= 3);

    const choiceEntry = history.find(
      (h) => typeof h !== 'string' && h.kind === 'choice',
    ) as { kind: 'choice'; text: string } | undefined;

    assert.ok(choiceEntry);
    assert.equal(choiceEntry?.text, awakenState.options[0].text);
  });
});
