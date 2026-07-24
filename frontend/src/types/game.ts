export type ClassType = 'warrior' | 'mage' | 'rogue' | 'ranger';
export type TabId = 'story' | 'inventory' | 'stats' | 'shop';
export type EnemyLineArtType =
  | 'none'
  | 'orc_guardian'
  | 'dragon'
  | 'skeleton'
  | 'shadow'
  | 'desert_spirit';

export type StatKey = 'hp' | 'mana' | 'gold' | 'energy' | 'strength' | 'agility' | 'intellect';

export interface ConditionCheck {
  stat: StatKey;
  min: number;
}

export interface GameOption {
  id: string;
  text: string;
  icon: 'sword' | 'spell' | 'key' | 'retreat' | 'talk' | 'search' | 'shield';
  condition_check: ConditionCheck;
  energy_cost?: number;
}

export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  strength: number;
  agility: number;
  intellect: number;
  xp: number;
  level: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  quantity: number;
}

export interface PendingDiceRoll {
  requiredRollType: 'strength' | 'agility' | 'intellect' | 'luck';
  minRollSuccess: number;
  context: string;
}

export interface GameState {
  deviceId: string;
  characterName: string;
  classType: ClassType;
  awakened: boolean;
  unlockedFullUi: boolean;
  playDayCount: number;
  currentLocation: string;
  storyText: string;
  enemyLineArtType: EnemyLineArtType;
  needsDiceRoll: boolean;
  pendingDiceRoll: PendingDiceRoll | null;
  options: GameOption[];
  stats: PlayerStats;
  inventory: InventoryItem[];
  toastMessage: string | null;
  purchasedSkus: string[];
  msUntilNextEnergy: number;
  energyRegenMinutes: number;
  lastRoll?: {
    rawRoll: number;
    modifier: number;
    total: number;
    success: boolean;
  };
}

export interface ShopSku {
  sku: string;
  title: string;
  description: string;
  priceTomans: number;
  type: 'consumable' | 'non_consumable';
}

export interface InboxItem {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const CLASS_LABELS: Record<ClassType, string> = {
  warrior: 'جنگجو',
  mage: 'جادوگر',
  rogue: 'راهزن',
  ranger: 'شکارچی',
};

export const ROLL_TYPE_LABELS: Record<string, string> = {
  strength: 'قدرت',
  agility: 'چابکی',
  intellect: 'خرد',
  luck: 'اقبال',
};
