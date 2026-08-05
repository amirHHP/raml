export type ClassType = 'warrior' | 'mage' | 'rogue' | 'ranger';
export type PanelTab = 'story' | 'inventory' | 'stats' | 'shop' | 'home';
export type HomeActivityId =
  | 'sword_training'
  | 'obstacle_jump'
  | 'meditation'
  | 'excavation'
  | 'hunting';

export interface ActiveHomeActivity {
  activityId: HomeActivityId;
  startTime: string; // ISO timestamp
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
  | 'desert_spirit';

export type StatKey = 'hp' | 'mana' | 'gold' | 'energy' | 'strength' | 'agility' | 'intellect';

export type FeatureUnlocks = {
  inventory: boolean;
  stats: boolean;
  hp: boolean;
  mana: boolean;
  gold: boolean;
  home: boolean;
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

export interface StatsUpdate {
  hp?: number;
  mana?: number;
  gold?: number;
  energy_change?: number;
  strength?: number;
  agility?: number;
  intellect?: number;
  xp?: number;
}

/** Body slot for wearable discovered items (shown on stats silhouette). */
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

export interface AiGameResponse {
  story_text: string;
  current_location: string;
  enemy_line_art_type: EnemyLineArtType;
  stats_update: StatsUpdate;
  needs_dice_roll: boolean;
  required_roll_type: 'strength' | 'agility' | 'intellect' | 'luck' | null;
  min_roll_success: number | null;
  options: Array<{
    text: string;
    icon: GameOption['icon'];
    condition_check: ConditionCheck;
    item_reward?: string | null;
    requires_item?: string | null;
  }>;
  discovered_item?: {
    id: string;
    name: string;
    description: string;
    icon: string;
    effect?: string | null;
    /** Wearable slot; null/omitted = not shown on body silhouette. */
    equip_slot?: EquipSlot | null;
  } | null;
  toast_message?: string | null;
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
  | { kind: 'story'; text: string }
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

export interface PlayerDocument {
  deviceId: string;
  characterName: string;
  classType: ClassType;
  awakened: boolean;
  unlockedFullUi: boolean;
  createdAt: Date;
  lastEnergyAt: Date;
  lastPlayedAt: Date;
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
  storyHistory: Array<string | StoryHistoryEntry>;
  storyTurnCount: number;
  homeUnlocked?: boolean;
  atHome?: boolean;
  activeHomeActivity?: ActiveHomeActivity | null;
}
