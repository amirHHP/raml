import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getEquippedBySlot, listEquippedItems } from './equipment.ts';
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

  it('maps wearables to slots; later item wins same slot', () => {
    const result = getEquippedBySlot([
      item({ id: 'old_hat', name: 'کلاه کهنه', equipSlot: 'head' }),
      item({ id: 'amulet', name: 'طلسم', equipSlot: 'accessory' }),
      item({ id: 'new_hat', name: 'کلاه نو', equipSlot: 'head' }),
    ]);
    assert.equal(result.head?.id, 'new_hat');
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
