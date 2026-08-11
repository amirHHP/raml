export type Language = 'fa' | 'en';
export type ClassType = 'warrior' | 'mage' | 'rogue' | 'ranger';
export type TabId = 'story' | 'inventory' | 'stats' | 'shop' | 'home';

export type HomeActivityId =
  | 'sword_training'
  | 'obstacle_jump'
  | 'meditation'
  | 'excavation'
  | 'hunting';

export interface ActiveHomeActivity {
  activityId: HomeActivityId;
  startTime: string;
  durationMinutes: number;
  costCoins: number;
}

export interface HomeActionResult {
  success: boolean;
  activityId: HomeActivityId;
  durationMinutes: number;
  rewards: {
    strengthGained?: number;
    agilityGained?: number;
    intellectGained?: number;
    goldGained?: number;
    hpGained?: number;
    maxHpGained?: number;
    itemsGained?: InventoryItem[];
  };
  risksEncountered: {
    hpLost?: number;
    goldLost?: number;
    itemsLostCount?: number;
    logText: string;
  };
  summaryMessage: string;
}

export type EnemyLineArtType =
  | 'none'
  | 'orc_guardian'
  | 'dragon'
  | 'skeleton'
  | 'shadow'
  | 'desert_spirit'
  | 'chest'
  | 'castle'
  | 'boss_demon'
  | 'magic_portal'
  | 'ancient_tree'
  | 'phoenix'
  | 'mystic_potion'
  | 'ruined_altar'
  | 'wolf';

export type StatKey = 'hp' | 'mana' | 'gold' | 'energy' | 'strength' | 'agility' | 'intellect';

/** Body slot for wearable inventory items (stats silhouette). */
export type EquipSlot =
  | 'head'
  | 'chest'
  | 'hands'
  | 'legs'
  | 'feet'
  | 'weapon'
  | 'accessory';

export const EQUIP_SLOTS: EquipSlot[] = [
  'head',
  'chest',
  'hands',
  'legs',
  'feet',
  'weapon',
  'accessory',
];

export const EQUIP_SLOT_LABELS: Record<EquipSlot, string> = {
  head: 'سر',
  chest: 'سینه',
  hands: 'دست',
  legs: 'پا',
  feet: 'کفش',
  weapon: 'سلاح',
  accessory: 'زیور',
};

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
  item_reward?: string | null;
  requires_item?: string | null;
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
  /** When set, item appears on the character silhouette for that slot. */
  equipSlot?: EquipSlot | null;
  effect?: string | null;
  /** True when item is actively worn/equipped by the character. */
  isEquipped?: boolean;
}

export type StoryHistoryEntry =
  | { kind: 'story'; text: string; enemyLineArtType?: EnemyLineArtType; asciiArt?: string | null; svgArt?: string | null; imageUrl?: string | null }
  | {
      kind: 'choice';
      text: string;
      effect?: string;
      icon?: GameOption['icon'];
      item_reward?: string | null;
    };

export interface PendingDiceRoll {
  requiredRollType: 'strength' | 'agility' | 'intellect' | 'luck';
  minRollSuccess: number;
  context: string;
}

export interface GameState {
  deviceId: string;
  characterName: string;
  classType: ClassType;
  language?: Language;
  awakened: boolean;
  unlockedFullUi: boolean;
  featureUnlocks: {
    inventory: boolean;
    stats: boolean;
    hp: boolean;
    mana: boolean;
    gold: boolean;
    home: boolean;
  };
  unlockTurns: {
    unlockInventoryAtTurn: number;
    unlockStatsAtTurn: number;
    unlockHpAtTurn: number;
    unlockManaAtTurn: number;
    unlockGoldAtTurn: number;
  };
  playDayCount: number;
  storyTurnCount: number;
  homeUnlocked?: boolean;
  atHome?: boolean;
  activeHomeActivity?: ActiveHomeActivity | null;
  storyHistory: Array<string | StoryHistoryEntry>;
  /** Milliseconds per word for story typewriter (lower = faster). */
  storyMsPerWord: number;
  aiMode: 'mock' | 'live';
  aiMockReason: string | null;
  lastAiSource: 'live' | 'mock' | 'error' | null;
  lastAiError: string | null;
  currentLocation: string;
  storyText: string;
  enemyLineArtType: EnemyLineArtType;
  asciiArt?: string | null;
  svgArt?: string | null;
  imageUrl?: string | null;
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
  referralCode: string;
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

export interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  maxReferrals: number;
  referredBy: string | null;
  referredFriends: string[];
}

export interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  titleEn: string;
  items: string[];
  itemsEn: string[];
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
