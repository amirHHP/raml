import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseItemStatEffect, toEnDigits } from './itemEffects';
import {
  setUseMemory,
  getMemoryPlayers,
  toggleEquipItem,
  toClientState,
} from './gameState';

describe('Item Effect Parsing', () => {
  it('converts Persian digits to ASCII digits', () => {
    assert.equal(toEnDigits('۰۱۲۳۴۵۶۷۸۹'), '0123456789');
  });

  it('parses Persian stat bonus effects correctly (+۳ خرد)', () => {
    const effect1 = parseItemStatEffect('+۳ خرد');
    assert.deepEqual(effect1, { intellect: 3 });

    const effect2 = parseItemStatEffect('✨ کاربرد: +۳ خرد');
    assert.deepEqual(effect2, { intellect: 3 });

    const effect3 = parseItemStatEffect('قدرت +۵');
    assert.deepEqual(effect3, { strength: 5 });

    const effect4 = parseItemStatEffect('چابکی +۳، خرد +۲');
    assert.deepEqual(effect4, { agility: 3, intellect: 2 });
  });

  it('parses English stat bonus effects correctly (+5 strength)', () => {
    const effect = parseItemStatEffect('+5 strength');
    assert.deepEqual(effect, { strength: 5 });
  });
});

describe('Equip / Unequip Equipment Logic', () => {
  setUseMemory(true);

  it('toggles equip status and updates player stats dynamically', async () => {
    const deviceId = 'test-equip-device-001';
    const playerStore = getMemoryPlayers();

    // Setup dummy player with 2 rings
    const dummyPlayer: any = {
      deviceId,
      characterName: 'Hero',
      classType: 'warrior',
      status: 'active',
      awakened: true,
      unlockedFullUi: true,
      createdAt: new Date(),
      lastEnergyAt: new Date(),
      lastPlayedAt: new Date(),
      playDayCount: 1,
      currentLocation: ' غار',
      storyText: 'تاریکی',
      enemyLineArtType: 'none',
      needsDiceRoll: false,
      pendingDiceRoll: null,
      options: [],
      stats: {
        hp: 100,
        maxHp: 100,
        mana: 50,
        maxMana: 50,
        gold: 100,
        energy: 5,
        maxEnergy: 10,
        strength: 5,
        agility: 5,
        intellect: 2,
        xp: 0,
        level: 1,
      },
      inventory: [
        {
          id: 'ancient_ring',
          name: 'انگشتر باستانی',
          description: 'انگشتری با نشان مفقود شده.',
          icon: '💍',
          quantity: 1,
          equipSlot: 'accessory',
          effect: '+۳ خرد',
          isEquipped: false,
        },
        {
          id: 'ruby_ring',
          name: 'انگشتر یاقوت',
          description: 'انگشتر قدرتمند.',
          icon: '💍',
          quantity: 1,
          equipSlot: 'accessory',
          effect: '+۵ قدرت',
          isEquipped: false,
        },
      ],
      toastMessage: null,
      purchasedSkus: [],
      storyHistory: [],
      storyTurnCount: 5,
    };
    playerStore.set(deviceId, dummyPlayer);

    // Initial intellect is 2
    assert.equal(dummyPlayer.stats.intellect, 2);

    // Equip Ancient Ring (+3 intellect)
    const state1 = await toggleEquipItem(deviceId, 'ancient_ring');
    assert.equal(state1.stats.intellect, 5); // 2 + 3 = 5
    assert.equal(state1.inventory.find((i) => i.id === 'ancient_ring')?.isEquipped, true);
    assert.equal(state1.toastMessage, 'تجهیز شد: انگشتر باستانی');

    // Equip Ruby Ring (+5 strength) -> Should automatically unequip Ancient Ring
    const state2 = await toggleEquipItem(deviceId, 'ruby_ring');
    assert.equal(state2.stats.intellect, 2); // Ancient ring unequipped: 5 - 3 = 2
    assert.equal(state2.stats.strength, 10); // Ruby ring equipped: 5 + 5 = 10
    assert.equal(state2.inventory.find((i) => i.id === 'ancient_ring')?.isEquipped, false);
    assert.equal(state2.inventory.find((i) => i.id === 'ruby_ring')?.isEquipped, true);

    // Unequip Ruby Ring
    const state3 = await toggleEquipItem(deviceId, 'ruby_ring');
    assert.equal(state3.stats.strength, 5); // 10 - 5 = 5
    assert.equal(state3.inventory.find((i) => i.id === 'ruby_ring')?.isEquipped, false);
    assert.equal(state3.toastMessage, 'از تن درآمد: انگشتر یاقوت');
  });
});
