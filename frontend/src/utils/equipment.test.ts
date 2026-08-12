import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanItemName, getEquippedBySlot, getItemEmoji, listEquippedItems } from './equipment.ts';
import type { InventoryItem } from '../types/game.ts';

function item(
  partial: Partial<InventoryItem> & Pick<InventoryItem, 'id' | 'name'>,
): InventoryItem {
  return {
    description: '',
    icon: 'item',
    quantity: 1,
    ...partial,
  };
}

describe('getEquippedBySlot', () => {
  it('ignores non-wearable items', () => {
    assert.deepEqual(
      getEquippedBySlot([
        item({ id: 'herb', name: 'گیاه' }),
        item({ id: 'key', name: 'کلید', equipSlot: null }),
      ]),
      {},
    );
  });

  it('maps wearables to slots; first item wins unless specified', () => {
    const result = getEquippedBySlot([
      item({ id: 'old_hat', name: 'کلاه کهنه', equipSlot: 'head' }),
      item({ id: 'amulet', name: 'طلسم', equipSlot: 'accessory' }),
      item({ id: 'new_hat', name: 'کلاه نو', equipSlot: 'head' }),
    ]);
    assert.equal(result.head?.id, 'old_hat');
    assert.equal(result.accessory?.name, 'طلسم');
  });
});

describe('listEquippedItems', () => {
  it('returns slots in canonical order', () => {
    const listed = listEquippedItems([
      item({ id: 'sword', name: 'شمشیر', equipSlot: 'weapon' }),
      item({ id: 'helm', name: 'کلاه', equipSlot: 'head' }),
    ]);
    assert.deepEqual(
      listed.map((e) => e.slot),
      ['head', 'weapon'],
    );
  });
});

describe('getItemEmoji & cleanItemName', () => {
  it('maps icon slugs like amulet to emojis', () => {
    assert.equal(getItemEmoji({ icon: 'amulet', name: 'طلسم شن' }), '📿');
    assert.equal(getItemEmoji({ icon: 'sword', name: 'شمشیر تاریکی' }), '🗡️');
    assert.equal(getItemEmoji({ icon: 'shield', name: 'سپر کویر' }), '🛡️');
    assert.equal(getItemEmoji({ icon: 'potion', name: 'معجون حیات' }), '🧪');
  });

  it('preserves existing emoji icons', () => {
    assert.equal(getItemEmoji({ icon: '💍', name: 'حلقه قدرت' }), '💍');
  });

  it('infers emoji from equipSlot or Persian name when icon slug is unknown', () => {
    assert.equal(getItemEmoji({ name: 'طلسم شن القدیم' }), '📿');
    assert.equal(getItemEmoji({ equipSlot: 'accessory' }), '📿');
  });

  it('strips redundant leading icon slug from name', () => {
    assert.equal(cleanItemName('amulet طلسم شن', 'amulet'), 'طلسم شن');
    assert.equal(cleanItemName('طلسم شن', 'amulet'), 'طلسم شن');
  });
});
