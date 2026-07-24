import { v4 as uuidv4 } from 'uuid';
import { Player, type IPlayer } from '../models/Player';
import { config } from '../config';
import { regenerateEnergy, spendEnergy, msUntilNextEnergy } from './energy';
import { generateGameTurn, resolveAiMode } from './ai';
import { getStoryMsPerWord } from './gameSettings';
import { peekRuntimeAiSettings, type RuntimeAiSettings } from './aiSettings';
import {
  buildActionPrompt,
  buildAwakenPrompt,
  buildDicePrompt,
} from './promptService';
import type {
  AiGameResponse,
  ClassType,
  GameOption,
  PlayerDocument,
  StatsUpdate,
} from '../types/game';

/** In-memory fallback when MongoDB is unavailable. */
const memoryStore = new Map<string, IPlayer>();

let useMemory = false;

export function setUseMemory(value: boolean): void {
  useMemory = value;
}

export function isUsingMemory(): boolean {
  return useMemory;
}

function settingsForClient(): RuntimeAiSettings {
  return (
    peekRuntimeAiSettings() || {
      openaiApiKey: config.openaiApiKey,
      openaiBaseUrl: config.openaiBaseUrl,
      openaiModel: config.openaiModel,
      useMockAi: config.useMockAi,
    }
  );
}

export function getMemoryPlayers(): Map<string, IPlayer> {
  return memoryStore;
}

export async function persistPlayer(player: IPlayer): Promise<IPlayer> {
  if (useMemory) {
    memoryStore.set(player.deviceId, player);
    return player;
  }
  await player.save();
  return player;
}

function defaultPlayer(deviceId: string): Partial<IPlayer> {
  const now = new Date();
  return {
    deviceId,
    characterName: '',
    classType: 'warrior',
    status: 'active',
    awakened: false,
    unlockedFullUi: false,
    createdAt: now,
    lastEnergyAt: now,
    lastPlayedAt: now,
    playDayCount: 0,
    currentLocation: 'تاریکی مطلق',
    storyText: 'تاریکی مطلق. سکوت سنگین. چیزی در ژرفای وجودت می‌جنبد...',
    enemyLineArtType: 'none',
    needsDiceRoll: false,
    pendingDiceRoll: null,
    options: [],
    stats: {
      hp: 100,
      maxHp: 100,
      mana: 50,
      maxMana: 50,
      gold: 0,
      energy: 5,
      maxEnergy: config.energyMax,
      strength: 3,
      agility: 2,
      intellect: 2,
      xp: 0,
      level: 1,
    },
    inventory: [],
    toastMessage: null,
    purchasedSkus: [],
    storyHistory: [],
  };
}

function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime());
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

function computeUnlocked(player: IPlayer): boolean {
  // Full UI unlocks after 3 distinct play days OR explicit purchase / debug unlock
  if (player.unlockedFullUi) return true;
  if (player.purchasedSkus.includes('unlock_full_ui')) return true;
  return player.playDayCount >= 3;
}

function applyStatsUpdate(player: IPlayer, update: StatsUpdate): void {
  const s = player.stats;
  if (update.hp) s.hp = Math.max(0, Math.min(s.maxHp, s.hp + update.hp));
  if (update.mana) s.mana = Math.max(0, Math.min(s.maxMana, s.mana + update.mana));
  if (update.gold) s.gold = Math.max(0, s.gold + update.gold);
  if (update.energy_change) {
    s.energy = Math.max(0, Math.min(s.maxEnergy, s.energy + update.energy_change));
  }
  if (update.strength) s.strength += update.strength;
  if (update.agility) s.agility += update.agility;
  if (update.intellect) s.intellect += update.intellect;
  if (update.xp) {
    s.xp += update.xp;
    while (s.xp >= s.level * 100) {
      s.xp -= s.level * 100;
      s.level += 1;
      s.maxHp += 10;
      s.hp = s.maxHp;
      s.maxMana += 5;
      s.mana = s.maxMana;
    }
  }
}

function mapOptions(ai: AiGameResponse): GameOption[] {
  return ai.options.map((o) => ({
    id: uuidv4(),
    text: o.text,
    icon: o.icon,
    condition_check: o.condition_check,
    energy_cost: 1,
  }));
}

function applyAiResponse(player: IPlayer, ai: AiGameResponse): void {
  player.storyText = ai.story_text;
  player.currentLocation = ai.current_location;
  player.enemyLineArtType = ai.enemy_line_art_type;
  player.storyHistory = [...(player.storyHistory || []), ai.story_text].slice(-20);
  applyStatsUpdate(player, ai.stats_update || {});

  if (ai.discovered_item) {
    const existing = player.inventory.find((i) => i.id === ai.discovered_item!.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      player.inventory.push({ ...ai.discovered_item, quantity: 1 });
    }
  }

  player.toastMessage = ai.toast_message ?? (ai.discovered_item ? `آیتم جدید: ${ai.discovered_item.name}` : null);

  if (ai.needs_dice_roll && ai.required_roll_type && ai.min_roll_success != null) {
    player.needsDiceRoll = true;
    player.pendingDiceRoll = {
      requiredRollType: ai.required_roll_type,
      minRollSuccess: ai.min_roll_success,
      context: ai.story_text.slice(0, 200),
    };
    player.options = [];
  } else {
    player.needsDiceRoll = false;
    player.pendingDiceRoll = null;
    player.options = mapOptions(ai);
  }
}

async function persist(player: IPlayer): Promise<IPlayer> {
  return persistPlayer(player);
}

function assertNotBanned(player: IPlayer): void {
  if (player.status === 'banned') {
    throw Object.assign(new Error('حساب کاربری مسدود شده است'), { status: 403 });
  }
}

export async function getOrCreatePlayer(deviceId: string): Promise<IPlayer> {
  if (useMemory) {
    let p = memoryStore.get(deviceId);
    if (!p) {
      p = {
        ...defaultPlayer(deviceId),
        status: 'active',
        save: async () => p,
      } as unknown as IPlayer;
      memoryStore.set(deviceId, p);
    }
    assertNotBanned(p);
    regenerateEnergy(p);
    touchPlayDay(p);
    p.unlockedFullUi = computeUnlocked(p);
    return p;
  }

  let player = await Player.findOne({ deviceId });
  if (!player) {
    player = await Player.create(defaultPlayer(deviceId));
  }
  assertNotBanned(player);
  regenerateEnergy(player);
  touchPlayDay(player);
  player.unlockedFullUi = computeUnlocked(player);
  await player.save();
  return player;
}

function touchPlayDay(player: IPlayer): void {
  const now = new Date();
  const last = new Date(player.lastPlayedAt);
  const sameDay =
    last.getFullYear() === now.getFullYear() &&
    last.getMonth() === now.getMonth() &&
    last.getDate() === now.getDate();

  if (!sameDay) {
    // Count calendar days since character creation for unlock progression
    if (player.awakened) {
      player.playDayCount = Math.max(
        player.playDayCount + 1,
        daysBetween(new Date(player.createdAt || player.lastPlayedAt), now) + 1,
      );
    }
    player.lastPlayedAt = now;
  }
}

export function toClientState(player: IPlayer) {
  const turnCount = (player.storyHistory || []).length;
  const mode = resolveAiMode(settingsForClient(), Math.max(1, turnCount));
  return {
    deviceId: player.deviceId,
    characterName: player.characterName,
    classType: player.classType,
    awakened: player.awakened,
    unlockedFullUi: computeUnlocked(player),
    playDayCount: player.playDayCount,
    storyTurnCount: turnCount,
    storyHistory: player.storyHistory || [],
    storyMsPerWord: getStoryMsPerWord(),
    aiMode: mode.aiMode,
    aiMockReason: mode.aiMockReason,
    currentLocation: player.currentLocation,
    storyText: player.storyText,
    enemyLineArtType: player.enemyLineArtType,
    needsDiceRoll: player.needsDiceRoll,
    pendingDiceRoll: player.pendingDiceRoll,
    options: player.options,
    stats: player.stats,
    inventory: player.inventory,
    toastMessage: player.toastMessage,
    purchasedSkus: player.purchasedSkus,
    msUntilNextEnergy: msUntilNextEnergy(player),
    energyRegenMinutes: config.energyRegenMinutes,
  };
}

export async function awakenPlayer(
  deviceId: string,
  characterName: string,
  classType: ClassType = 'warrior',
) {
  const player = await getOrCreatePlayer(deviceId);
  if (player.awakened) {
    return toClientState(player);
  }

  const name = characterName.trim().slice(0, 24) || 'مسافر';
  player.characterName = name;
  player.classType = classType;
  player.awakened = true;
  player.playDayCount = 1;
  player.lastPlayedAt = new Date();

  // Class baseline tweaks
  if (classType === 'mage') {
    player.stats.intellect = 4;
    player.stats.strength = 1;
    player.stats.mana = 60;
    player.stats.maxMana = 60;
  } else if (classType === 'rogue') {
    player.stats.agility = 4;
    player.stats.strength = 2;
  } else if (classType === 'ranger') {
    player.stats.agility = 3;
    player.stats.intellect = 3;
  }

  const turnNumber = (player.storyHistory?.length || 0) + 1;
  const ai = await generateGameTurn(await buildAwakenPrompt(name, classType), {
    turnNumber,
  });
  applyAiResponse(player, ai);
  await persist(player);
  return toClientState(player);
}

export async function chooseOption(deviceId: string, optionId: string) {
  const player = await getOrCreatePlayer(deviceId);

  if (!player.awakened) throw Object.assign(new Error('هنوز بیدار نشده‌اید'), { status: 400 });
  if (player.needsDiceRoll) {
    throw Object.assign(new Error('ابتدا تاس را بریزید'), { status: 400 });
  }

  const option = player.options.find((o) => o.id === optionId);
  if (!option) throw Object.assign(new Error('گزینه نامعتبر'), { status: 400 });

  const cost = option.energy_cost ?? 1;
  if (!spendEnergy(player, cost)) {
    throw Object.assign(new Error('انرژی کافی نیست'), { status: 402 });
  }

  // Condition re-check server-side
  const statVal = getStatValue(player, option.condition_check.stat);
  if (statVal < option.condition_check.min) {
    throw Object.assign(new Error('شرایط لازم برآورده نشده'), { status: 400 });
  }

  // Apply option mana cost if spell-like
  if (option.condition_check.stat === 'mana' && option.condition_check.min > 0) {
    player.stats.mana = Math.max(0, player.stats.mana - option.condition_check.min);
  }

  player.toastMessage = null;

  const turnNumber = (player.storyHistory?.length || 0) + 1;
  const earlyResources = computeUnlocked(player) ? 'full' : 'energy_only';
  const ai = await generateGameTurn(
    await buildActionPrompt({
      name: player.characterName,
      classType: player.classType,
      level: player.stats.level,
      location: player.currentLocation,
      storySnippet: player.storyText.slice(0, 400),
      stats: {
        hp: player.stats.hp,
        mana: player.stats.mana,
        gold: player.stats.gold,
        energy: player.stats.energy,
        strength: player.stats.strength,
        agility: player.stats.agility,
        intellect: player.stats.intellect,
      },
      inventory: player.inventory.map((i) => i.name),
      chosenOption: option.text,
      earlyResources,
    }),
    { turnNumber },
  );

  applyAiResponse(player, ai);
  await persist(player);
  return toClientState(player);
}

function getStatValue(player: IPlayer, stat: string): number {
  const s = player.stats;
  switch (stat) {
    case 'hp':
      return s.hp;
    case 'mana':
      return s.mana;
    case 'gold':
      return s.gold;
    case 'energy':
      return s.energy;
    case 'strength':
      return s.strength;
    case 'agility':
      return s.agility;
    case 'intellect':
      return s.intellect;
    default:
      return 0;
  }
}

export async function submitDiceRoll(
  deviceId: string,
  payload: { rawRoll: number; modifier: number; total: number },
) {
  const player = await getOrCreatePlayer(deviceId);

  if (!player.needsDiceRoll || !player.pendingDiceRoll) {
    throw Object.assign(new Error('تاس‌ریزی در انتظار نیست'), { status: 400 });
  }

  const { rawRoll, modifier, total } = payload;
  if (rawRoll < 1 || rawRoll > 20) {
    throw Object.assign(new Error('عدد تاس نامعتبر'), { status: 400 });
  }

  const pending = player.pendingDiceRoll;
  const success = total >= pending.minRollSuccess;

  const turnNumber = (player.storyHistory?.length || 0) + 1;
  const ai = await generateGameTurn(
    await buildDicePrompt({
      name: player.characterName,
      rollTotal: total,
      rawRoll,
      modifier,
      requiredType: pending.requiredRollType,
      minSuccess: pending.minRollSuccess,
      success,
      location: player.currentLocation,
      storySnippet: pending.context || player.storyText.slice(0, 300),
    }),
    { turnNumber },
  );

  applyAiResponse(player, ai);
  await persist(player);
  return { ...toClientState(player), lastRoll: { rawRoll, modifier, total, success } };
}

export async function clearToast(deviceId: string) {
  const player = await getOrCreatePlayer(deviceId);
  player.toastMessage = null;
  await persist(player);
  return toClientState(player);
}

export async function debugUnlock(deviceId: string) {
  const player = await getOrCreatePlayer(deviceId);
  player.unlockedFullUi = true;
  player.playDayCount = Math.max(player.playDayCount, 3);
  // Seed progressed demo state if still sparse
  if (player.awakened && player.stats.gold === 0) {
    player.stats.gold = 1250;
    player.stats.hp = 78;
    player.stats.mana = 45;
    player.stats.energy = 8;
    player.stats.level = 3;
    player.stats.xp = 40;
    player.currentLocation = 'غار اژدهای تاریکی - تالار ورودی';
    player.enemyLineArtType = 'orc_guardian';
    player.storyText =
      'نگهبان سنگی غار بیدار شده است. چشمان اخگرگونه‌اش به تو دوخته شده. هوا بوی گوگرد می‌دهد و از اعماق تالار صدای نفس‌های سنگین به گوش می‌رسد.';
    player.needsDiceRoll = true;
    player.pendingDiceRoll = {
      requiredRollType: 'strength',
      minRollSuccess: 12,
      context: 'مقابله با نگهبان غار',
    };
    player.options = [];
  }
  await persist(player);
  return toClientState(player);
}

export type { PlayerDocument };