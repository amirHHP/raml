export type ClassType = 'warrior' | 'mage' | 'rogue' | 'ranger';
export type PanelTab = 'story' | 'inventory' | 'stats' | 'shop';
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
  }>;
  discovered_item?: {
    id: string;
    name: string;
    description: string;
    icon: string;
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
}

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
  storyHistory: string[];
  storyTurnCount: number;
}
