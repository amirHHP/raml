import {
  EQUIP_SLOTS,
  type EquipSlot,
  type InventoryItem,
} from '../types/game';

/** Get worn/equipped item per slot (respecting item.isEquipped status). */
export function getEquippedBySlot(
  inventory: InventoryItem[],
): Partial<Record<EquipSlot, InventoryItem>> {
  const equipped: Partial<Record<EquipSlot, InventoryItem>> = {};
  for (const item of inventory) {
    const slot = item.equipSlot;
    if (!slot || !EQUIP_SLOTS.includes(slot)) continue;
    if (item.isEquipped === true) {
      equipped[slot] = item;
    } else if (!equipped[slot] && item.isEquipped !== false) {
      equipped[slot] = item;
    }
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

const ITEM_ICON_MAP: Record<string, string> = {
  amulet: '📿',
  pendant: '📿',
  necklace: '📿',
  talisman: '📿',
  charm: '📿',
  sword: '🗡️',
  dagger: '🗡️',
  blade: '⚔️',
  weapon: '⚔️',
  shield: '🛡️',
  armor: '🛡️',
  chest: '🛡️',
  helmet: '🪖',
  head: '🪖',
  boots: '🥾',
  feet: '🥾',
  gloves: '🥊',
  hands: '🥊',
  ring: '💍',
  accessory: '📿',
  potion: '🧪',
  elixir: '🧪',
  flask: '🧪',
  scroll: '📜',
  map: '🗺️',
  book: '📖',
  grimoire: '📖',
  key: '🔑',
  gem: '💎',
  crystal: '💎',
  jewel: '💎',
  gold: '🪙',
  coin: '🪙',
  search: '🔍',
  backpack: '🎒',
  bag: '🎒',
};

const SLOT_EMOJI_MAP: Record<string, string> = {
  weapon: '⚔️',
  head: '🪖',
  chest: '🛡️',
  hands: '🥊',
  legs: '👖',
  feet: '🥾',
  accessory: '📿',
};

export function isEmoji(str?: string | null): boolean {
  if (!str) return false;
  return /\p{Extended_Pictographic}/u.test(str);
}

export function getItemEmoji(item?: Partial<InventoryItem> | string | null): string {
  if (!item) return '🎒';
  const iconStr = typeof item === 'string' ? item : item.icon;
  const slotStr = typeof item === 'object' && item ? item.equipSlot : null;
  const nameStr = typeof item === 'object' && item ? item.name : null;

  if (iconStr && isEmoji(iconStr)) {
    return iconStr;
  }

  if (iconStr) {
    const key = iconStr.trim().toLowerCase();
    if (ITEM_ICON_MAP[key]) return ITEM_ICON_MAP[key];
  }

  if (slotStr && SLOT_EMOJI_MAP[slotStr.toLowerCase()]) {
    return SLOT_EMOJI_MAP[slotStr.toLowerCase()];
  }

  const searchText = `${iconStr || ''} ${nameStr || ''}`.toLowerCase();

  if (/(طلا|سکه|coin|gold)/.test(searchText)) return '🪙';
  if (/(طلسم|تعویذ|پلاک|گردنبند|مدال|amulet|pendant|talisman)/.test(searchText)) return '📿';
  if (/(شمشیر|خنجر|تیغ|سلاح|sword|dagger|blade|weapon)/.test(searchText)) return '🗡️';
  if (/(سپر|زره|جوشن|کلاه|shield|armor|chest|helmet)/.test(searchText)) return '🛡️';
  if (/(معجون|نوشدارو|اکسیر|شیشه|potion|elixir|flask)/.test(searchText)) return '🧪';
  if (/(انگشتر|حلقه|ring)/.test(searchText)) return '💍';
  if (/(طومار|کتاب|نقشه|scroll|book|map)/.test(searchText)) return '📜';
  if (/(کلید|key)/.test(searchText)) return '🔑';
  if (/(گوهر|الماس|کریستال|gem|crystal)/.test(searchText)) return '💎';

  return '🎒';
}

export function cleanItemName(name?: string | null, iconStr?: string | null): string {
  if (!name) return '';
  let cleaned = name.trim();
  if (iconStr && !isEmoji(iconStr)) {
    const iconSlug = iconStr.trim();
    if (cleaned.toLowerCase().startsWith(iconSlug.toLowerCase() + ' ')) {
      cleaned = cleaned.slice(iconSlug.length).trim();
    }
  }
  return cleaned;
}

