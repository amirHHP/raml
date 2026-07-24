import {
  EQUIP_SLOTS,
  type EquipSlot,
  type InventoryItem,
} from '../types/game';

/** Latest wearable item per slot (later inventory entries win). */
export function getEquippedBySlot(
  inventory: InventoryItem[],
): Partial<Record<EquipSlot, InventoryItem>> {
  const equipped: Partial<Record<EquipSlot, InventoryItem>> = {};
  for (const item of inventory) {
    const slot = item.equipSlot;
    if (!slot || !EQUIP_SLOTS.includes(slot)) continue;
    equipped[slot] = item;
  }
  return equipped;
}

export function listEquippedItems(
  inventory: InventoryItem[],
): Array<{ slot: EquipSlot; item: InventoryItem }> {
  const bySlot = getEquippedBySlot(inventory);
  return EQUIP_SLOTS.flatMap((slot) => {
    const item = bySlot[slot];
    return item ? [{ slot, item }] : [];
  });
}
