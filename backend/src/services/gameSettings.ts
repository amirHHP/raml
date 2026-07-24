import { config } from '../config';
import { AdminSettings, type IAdminSettings } from '../models/AdminSettings';

export const DEFAULT_STORY_MS_PER_WORD = 400;
export const MIN_STORY_MS_PER_WORD = 80;
export const MAX_STORY_MS_PER_WORD = 2000;

export type PublicGameSettings = {
  storyMsPerWord: number;
  updatedAt: string | null;
};

let useMemory = false;
let memoryMs: number | null = null;
let cachedMs: number | null = null;

export function setGameSettingsMemory(value: boolean): void {
  useMemory = value;
  cachedMs = null;
}

/** Clamp to a safe typewriter range. */
export function clampStoryMsPerWord(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_STORY_MS_PER_WORD;
  return Math.min(
    MAX_STORY_MS_PER_WORD,
    Math.max(MIN_STORY_MS_PER_WORD, Math.round(value)),
  );
}

function fromEnvOrDefault(): number {
  const raw = Number(process.env.STORY_MS_PER_WORD);
  if (Number.isFinite(raw) && raw > 0) return clampStoryMsPerWord(raw);
  return DEFAULT_STORY_MS_PER_WORD;
}

/** Sync read for embedding in client game state. */
export function getStoryMsPerWord(): number {
  return cachedMs ?? fromEnvOrDefault();
}

export async function ensureGameSettingsLoaded(): Promise<number> {
  if (cachedMs != null) return cachedMs;

  if (useMemory) {
    cachedMs = clampStoryMsPerWord(memoryMs ?? fromEnvOrDefault());
    return cachedMs;
  }

  const doc = await AdminSettings.findOne({ singletonKey: 'default' }).lean<IAdminSettings | null>();
  const raw =
    doc && typeof doc.storyMsPerWord === 'number' ? doc.storyMsPerWord : fromEnvOrDefault();
  cachedMs = clampStoryMsPerWord(raw);
  return cachedMs;
}

export async function getPublicGameSettings(): Promise<PublicGameSettings> {
  const storyMsPerWord = await ensureGameSettingsLoaded();
  if (useMemory) {
    return { storyMsPerWord, updatedAt: null };
  }
  const doc = (await AdminSettings.findOne({ singletonKey: 'default' })) as IAdminSettings | null;
  return {
    storyMsPerWord,
    updatedAt: doc?.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

export async function updateGameSettings(input: {
  storyMsPerWord: number;
}): Promise<PublicGameSettings> {
  const storyMsPerWord = clampStoryMsPerWord(input.storyMsPerWord);

  if (useMemory) {
    memoryMs = storyMsPerWord;
    cachedMs = storyMsPerWord;
    return { storyMsPerWord, updatedAt: new Date().toISOString() };
  }

  const doc = await AdminSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      $set: { storyMsPerWord },
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

  cachedMs = storyMsPerWord;
  return {
    storyMsPerWord,
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : null,
  };
}

export function clearGameSettingsCache(): void {
  cachedMs = null;
}
