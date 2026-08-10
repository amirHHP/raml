import mongoose, { Schema, Document } from 'mongoose';
import type {
  ClassType,
  EnemyLineArtType,
  GameOption,
  InventoryItem,
  Language,
  PendingDiceRoll,
  PlayerStats,
  StoryHistoryEntry,
} from '../types/game';

export type PlayerStatus = 'active' | 'banned';

export interface IPlayer extends Document {
  deviceId: string;
  characterName: string;
  classType: ClassType;
  language: Language;
  status: PlayerStatus;
  awakened: boolean;
  unlockedFullUi: boolean;
  createdAt: Date;
  lastEnergyAt: Date;
  lastPlayedAt: Date;
  playDayCount: number;
  currentLocation: string;
  storyText: string;
  enemyLineArtType: EnemyLineArtType;
  asciiArt?: string | null;
  svgArt?: string | null;
  needsDiceRoll: boolean;
  pendingDiceRoll: PendingDiceRoll | null;
  options: GameOption[];
  stats: PlayerStats;
  inventory: InventoryItem[];
  toastMessage: string | null;
  purchasedSkus: string[];
  storyHistory: Array<string | StoryHistoryEntry>;
  /** Durable story turn counter (storyHistory is capped for context). */
  storyTurnCount: number;
  /** Last story generation source for client honesty. */
  lastAiSource?: 'live' | 'mock' | 'error' | null;
  lastAiError?: string | null;
  homeUnlocked?: boolean;
  atHome?: boolean;
  activeHomeActivity?: {
    activityId: string;
    startTime: Date;
    durationMinutes: number;
    costCoins: number;
  } | null;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
}

const ConditionSchema = new Schema(
  {
    stat: { type: String, required: true },
    min: { type: Number, required: true },
  },
  { _id: false },
);

const OptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    icon: { type: String, required: true },
    condition_check: { type: ConditionSchema, required: true },
    energy_cost: { type: Number, default: 1 },
    item_reward: { type: String, required: false, default: undefined },
    requires_item: { type: String, required: false, default: undefined },
  },
  { _id: false },
);

const StatsSchema = new Schema(
  {
    hp: { type: Number, default: 100 },
    maxHp: { type: Number, default: 100 },
    mana: { type: Number, default: 50 },
    maxMana: { type: Number, default: 50 },
    gold: { type: Number, default: 0 },
    energy: { type: Number, default: 5 },
    maxEnergy: { type: Number, default: 10 },
    strength: { type: Number, default: 3 },
    agility: { type: Number, default: 2 },
    intellect: { type: Number, default: 2 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
  },
  { _id: false },
);

const InventorySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    effect: { type: String, required: false, default: undefined },
    equipSlot: {
      type: String,
      enum: ['head', 'chest', 'hands', 'legs', 'feet', 'weapon', 'accessory'],
      required: false,
      default: undefined,
    },
    isEquipped: { type: Boolean, default: false },
  },
  { _id: false },
);

const PendingDiceSchema = new Schema(
  {
    requiredRollType: {
      type: String,
      enum: ['strength', 'agility', 'intellect', 'luck'],
      required: true,
    },
    minRollSuccess: { type: Number, required: true },
    context: { type: String, default: '' },
  },
  { _id: false },
);

const PlayerSchema = new Schema<IPlayer>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    characterName: { type: String, default: '' },
    classType: {
      type: String,
      enum: ['warrior', 'mage', 'rogue', 'ranger'],
      default: 'warrior',
    },
    language: {
      type: String,
      enum: ['fa', 'en'],
      default: 'fa',
    },
    status: {
      type: String,
      enum: ['active', 'banned'],
      default: 'active',
      index: true,
    },
    awakened: { type: Boolean, default: false },
    unlockedFullUi: { type: Boolean, default: false },
    lastEnergyAt: { type: Date, default: Date.now },
    lastPlayedAt: { type: Date, default: Date.now },
    playDayCount: { type: Number, default: 0 },
    currentLocation: { type: String, default: 'تاریکی مطلق' },
    storyText: {
      type: String,
      default: 'تاریکی مطلق. سکوت سنگین. چیزی در ژرفای وجودت می‌جنبد...',
    },
    enemyLineArtType: { type: String, default: 'none' },
    asciiArt: { type: String, default: null },
    svgArt: { type: String, default: null },
    needsDiceRoll: { type: Boolean, default: false },
    pendingDiceRoll: { type: PendingDiceSchema, default: null },
    options: { type: [OptionSchema], default: [] },
    stats: { type: StatsSchema, default: () => ({}) },
    inventory: { type: [InventorySchema], default: [] },
    toastMessage: { type: String, default: null },
    purchasedSkus: { type: [String], default: [] },
    storyHistory: { type: Schema.Types.Mixed, default: [] } as any,
    storyTurnCount: { type: Number, default: 0 },
    lastAiSource: { type: String, default: null },
    lastAiError: { type: String, default: null },
    homeUnlocked: { type: Boolean, default: false },
    atHome: { type: Boolean, default: false },
    activeHomeActivity: {
      type: new Schema(
        {
          activityId: { type: String, required: true },
          startTime: { type: Date, required: true },
          durationMinutes: { type: Number, required: true },
          costCoins: { type: Number, default: 0 },
        },
        { _id: false },
      ),
      default: null,
    },
    referralCode: { type: String, default: '', unique: true, sparse: true },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Player =
  mongoose.models.Player || mongoose.model<IPlayer>('Player', PlayerSchema);