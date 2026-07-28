import { config } from '../config';
import { AdminSettings, type IAdminSettings } from '../models/AdminSettings';

export const DEFAULT_STORY_MS_PER_WORD = 160;
export const MIN_STORY_MS_PER_WORD = 80;
export const MAX_STORY_MS_PER_WORD = 2000;

export const MIN_UNLOCK_TURN = 1;
export const MAX_UNLOCK_TURN = 500;

/** Story-turn thresholds for progressive feature unlocks. */
export type UnlockTurnSettings = {
  unlockInventoryAtTurn: number;
  unlockStatsAtTurn: number;
  unlockHpAtTurn: number;
  unlockManaAtTurn: number;
  unlockGoldAtTurn: number;
};

export const DEFAULT_UNLOCK_TURNS: UnlockTurnSettings = {
  unlockInventoryAtTurn: 10,
  unlockStatsAtTurn: 20,
  unlockHpAtTurn: 20,
  unlockManaAtTurn: 30,
  unlockGoldAtTurn: 40,
};

export type PublicGameSettings = {
  storyMsPerWord: number;
  updatedAt: string | null;
} & UnlockTurnSettings;

type CachedGameSettings = {
  storyMsPerWord: number;
} & UnlockTurnSettings;

let useMemory = false;
let memorySettings: CachedGameSettings | null = null;
let cached: CachedGameSettings | null = null;

export function setGameSettingsMemory(value: boolean): void {
  useMemory = value;
  cached = null;
}

/** Clamp to a safe typewriter range. */
export function clampStoryMsPerWord(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_STORY_MS_PER_WORD;
  return Math.min(
    MAX_STORY_MS_PER_WORD,
    Math.max(MIN_STORY_MS_PER_WORD, Math.round(value)),
  );
}

export function clampUnlockTurn(value: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(MAX_UNLOCK_TURN, Math.max(MIN_UNLOCK_TURN, Math.round(value)));
}

function fromEnvOrDefaultMs(): number {
  const raw = Number(process.env.STORY_MS_PER_WORD);
  if (Number.isFinite(raw) && raw > 0) return clampStoryMsPerWord(raw);
  return DEFAULT_STORY_MS_PER_WORD;
}

function defaults(): CachedGameSettings {
  return {
    storyMsPerWord: fromEnvOrDefaultMs(),
    ...DEFAULT_UNLOCK_TURNS,
  };
}

function normalizeUnlocks(input: Partial<UnlockTurnSettings> | null | undefined): UnlockTurnSettings {
  return {
    unlockInventoryAtTurn: clampUnlockTurn(
      input?.unlockInventoryAtTurn ?? DEFAULT_UNLOCK_TURNS.unlockInventoryAtTurn,
      DEFAULT_UNLOCK_TURNS.unlockInventoryAtTurn,
    ),
    unlockStatsAtTurn: clampUnlockTurn(
      input?.unlockStatsAtTurn ?? DEFAULT_UNLOCK_TURNS.unlockStatsAtTurn,
      DEFAULT_UNLOCK_TURNS.unlockStatsAtTurn,
    ),
    unlockHpAtTurn: clampUnlockTurn(
      input?.unlockHpAtTurn ?? DEFAULT_UNLOCK_TURNS.unlockHpAtTurn,
      DEFAULT_UNLOCK_TURNS.unlockHpAtTurn,
    ),
    unlockManaAtTurn: clampUnlockTurn(
      input?.unlockManaAtTurn ?? DEFAULT_UNLOCK_TURNS.unlockManaAtTurn,
      DEFAULT_UNLOCK_TURNS.unlockManaAtTurn,
    ),
    unlockGoldAtTurn: clampUnlockTurn(
      input?.unlockGoldAtTurn ?? DEFAULT_UNLOCK_TURNS.unlockGoldAtTurn,
      DEFAULT_UNLOCK_TURNS.unlockGoldAtTurn,
    ),
  };
}

function fromDoc(doc: IAdminSettings | null): CachedGameSettings {
  const base = defaults();
  if (!doc) return base;
  return {
    storyMsPerWord: clampStoryMsPerWord(
      typeof doc.storyMsPerWord === 'number' ? doc.storyMsPerWord : base.storyMsPerWord,
    ),
    ...normalizeUnlocks(doc),
  };
}

/** Sync read for embedding in client game state. */
export function getStoryMsPerWord(): number {
  return cached?.storyMsPerWord ?? fromEnvOrDefaultMs();
}

/** Sync read of unlock thresholds (falls back to defaults). */
export function getUnlockTurnSettings(): UnlockTurnSettings {
  const src = cached ?? defaults();
  return normalizeUnlocks(src);
}

export async function ensureGameSettingsLoaded(): Promise<CachedGameSettings> {
  if (cached != null) return cached;

  if (useMemory) {
    cached = memorySettings ?? defaults();
    return cached;
  }

  const doc = await AdminSettings.findOne({ singletonKey: 'default' }).lean<IAdminSettings | null>();
  cached = fromDoc(doc);
  return cached;
}

export async function getPublicGameSettings(): Promise<PublicGameSettings> {
  const settings = await ensureGameSettingsLoaded();
  if (useMemory) {
    return { ...settings, updatedAt: null };
  }
  const doc = (await AdminSettings.findOne({ singletonKey: 'default' })) as IAdminSettings | null;
  return {
    ...settings,
    updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

export async function updateGameSettings(input: {
  storyMsPerWord?: number;
  unlockInventoryAtTurn?: number;
  unlockStatsAtTurn?: number;
  unlockHpAtTurn?: number;
  unlockManaAtTurn?: number;
  unlockGoldAtTurn?: number;
}): Promise<PublicGameSettings> {
  const current = await ensureGameSettingsLoaded();
  const next: CachedGameSettings = {
    storyMsPerWord:
      input.storyMsPerWord != null
        ? clampStoryMsPerWord(input.storyMsPerWord)
        : current.storyMsPerWord,
    ...normalizeUnlocks({
      unlockInventoryAtTurn: input.unlockInventoryAtTurn ?? current.unlockInventoryAtTurn,
      unlockStatsAtTurn: input.unlockStatsAtTurn ?? current.unlockStatsAtTurn,
      unlockHpAtTurn: input.unlockHpAtTurn ?? current.unlockHpAtTurn,
      unlockManaAtTurn: input.unlockManaAtTurn ?? current.unlockManaAtTurn,
      unlockGoldAtTurn: input.unlockGoldAtTurn ?? current.unlockGoldAtTurn,
    }),
  };

  if (useMemory) {
    memorySettings = next;
    cached = next;
    return { ...next, updatedAt: new Date().toISOString() };
  }

  const doc = await AdminSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      $set: {
        storyMsPerWord: next.storyMsPerWord,
        unlockInventoryAtTurn: next.unlockInventoryAtTurn,
        unlockStatsAtTurn: next.unlockStatsAtTurn,
        unlockHpAtTurn: next.unlockHpAtTurn,
        unlockManaAtTurn: next.unlockManaAtTurn,
        unlockGoldAtTurn: next.unlockGoldAtTurn,
      },
      $setOnInsert: {
        singletonKey: 'default',
        openaiApiKey: config.openaiApiKey,
        openaiBaseUrl: config.openaiBaseUrl,
        openaiModel: config.openaiModel,
        useMockAi: config.useMockAi,
      },
    },
    { upsert: true, new: true },
  );

  cached = next;
  return {
    ...next,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

export function clearGameSettingsCache(): void {
  cached = null;
}
