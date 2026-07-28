import { config } from '../config';
import { AdminSettings, type IAdminSettings } from '../models/AdminSettings';
import {
  GEMINI_OPENAI_BASE_URL,
  isGeminiBaseUrl,
  looksLikeGeminiApiKey,
} from './geminiModels';
import { AI_LIVE_FROM_TURN } from './aiPolicy';

export type RuntimeAiSettings = {
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  useMockAi: boolean;
};

type PublicAiSettings = {
  openaiApiKeyMasked: string;
  openaiApiKeySet: boolean;
  openaiBaseUrl: string;
  openaiModel: string;
  useMockAi: boolean;
  updatedAt: string | null;
  provider: 'gemini' | 'openai' | 'other';
  aiLiveFromTurn: number;
};

let useMemory = false;
let memorySettings: RuntimeAiSettings | null = null;
let cached: RuntimeAiSettings | null = null;
/** Wall-clock of the last Mongo read. Serverless instances keep a process cache
 * that would otherwise serve a stale key after another instance saved a new one. */
let cachedAtMs = 0;
const CACHE_TTL_MS = 5_000;
let onSettingsChanged: (() => void) | null = null;

export function setAiSettingsMemory(value: boolean): void {
  useMemory = value;
  cached = null;
  cachedAtMs = 0;
}

export function onAiSettingsChange(handler: () => void): void {
  onSettingsChanged = handler;
}

function fromEnv(): RuntimeAiSettings {
  return {
    openaiApiKey: config.openaiApiKey,
    openaiBaseUrl: config.openaiBaseUrl,
    openaiModel: config.openaiModel,
    useMockAi: config.useMockAi,
  };
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 3)}…${key.slice(-4)}`;
}

function detectProvider(settings: RuntimeAiSettings): PublicAiSettings['provider'] {
  if (isGeminiBaseUrl(settings.openaiBaseUrl) || looksLikeGeminiApiKey(settings.openaiApiKey)) {
    return 'gemini';
  }
  if (/api\.openai\.com/i.test(settings.openaiBaseUrl)) return 'openai';
  return 'other';
}

function toPublic(settings: RuntimeAiSettings, updatedAt: Date | null): PublicAiSettings {
  return {
    openaiApiKeyMasked: maskApiKey(settings.openaiApiKey),
    openaiApiKeySet: Boolean(settings.openaiApiKey),
    openaiBaseUrl: settings.openaiBaseUrl,
    openaiModel: settings.openaiModel,
    useMockAi: settings.useMockAi,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
    provider: detectProvider(settings),
    aiLiveFromTurn: AI_LIVE_FROM_TURN,
  };
}

function finalize(settings: RuntimeAiSettings): RuntimeAiSettings {
  let openaiBaseUrl = settings.openaiBaseUrl.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const openaiApiKey = settings.openaiApiKey;
  // Gemini keys work via Google's OpenAI-compatible endpoint
  if (
    looksLikeGeminiApiKey(openaiApiKey) &&
    (/api\.openai\.com/i.test(openaiBaseUrl) || !openaiBaseUrl)
  ) {
    openaiBaseUrl = GEMINI_OPENAI_BASE_URL.replace(/\/$/, '');
  }
  const openaiModel =
    settings.openaiModel.trim() ||
    (isGeminiBaseUrl(openaiBaseUrl) ? 'gemini-2.0-flash' : 'gpt-4o-mini');
  const useMockAi = !openaiApiKey ? true : settings.useMockAi;
  return { openaiApiKey, openaiBaseUrl, openaiModel, useMockAi };
}

export async function getRuntimeAiSettings(): Promise<RuntimeAiSettings> {
  if (cached && (useMemory || Date.now() - cachedAtMs < CACHE_TTL_MS)) {
    return cached;
  }

  if (useMemory) {
    cached = finalize(memorySettings || fromEnv());
    cachedAtMs = Date.now();
    return cached;
  }

  const doc = await AdminSettings.findOne({ singletonKey: 'default' }).lean<IAdminSettings | null>();
  if (!doc) {
    cached = finalize(fromEnv());
    cachedAtMs = Date.now();
    return cached;
  }

  // Prefer a non-empty DB key; otherwise fall back to the env key.
  cached = finalize({
    openaiApiKey: doc.openaiApiKey?.trim() ? doc.openaiApiKey : config.openaiApiKey,
    openaiBaseUrl: doc.openaiBaseUrl || config.openaiBaseUrl,
    openaiModel: doc.openaiModel || config.openaiModel,
    useMockAi:
      typeof doc.useMockAi === 'boolean' ? doc.useMockAi : config.useMockAi,
  });
  cachedAtMs = Date.now();
  return cached;
}

export async function getPublicAiSettings(): Promise<PublicAiSettings> {
  if (useMemory) {
    const settings = await getRuntimeAiSettings();
    return toPublic(settings, null);
  }

  const doc = (await AdminSettings.findOne({ singletonKey: 'default' })) as IAdminSettings | null;
  const settings = await getRuntimeAiSettings();
  return toPublic(settings, doc?.updatedAt || null);
}

export async function updateAiSettings(input: {
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  openaiModel?: string;
  useMockAi?: boolean;
}): Promise<PublicAiSettings> {
  const current = await getRuntimeAiSettings();

  let openaiApiKey = current.openaiApiKey;
  if (input.openaiApiKey !== undefined) {
    // Empty string clears; non-empty replaces; callers omit field to keep key
    openaiApiKey = input.openaiApiKey;
  }

  const next = finalize({
    openaiApiKey,
    openaiBaseUrl: input.openaiBaseUrl ?? current.openaiBaseUrl,
    openaiModel: input.openaiModel ?? current.openaiModel,
    useMockAi: input.useMockAi ?? current.useMockAi,
  });

  if (useMemory) {
    memorySettings = next;
    cached = next;
    cachedAtMs = Date.now();
    onSettingsChanged?.();
    return toPublic(next, new Date());
  }

  // Explicit $set so we never replace the whole AdminSettings document
  // (game unlock turns / storyMsPerWord live on the same singleton).
  const doc = await AdminSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      $set: {
        openaiApiKey: next.openaiApiKey,
        openaiBaseUrl: next.openaiBaseUrl,
        openaiModel: next.openaiModel,
        useMockAi: next.useMockAi,
      },
      $setOnInsert: { singletonKey: 'default' },
    },
    { upsert: true, new: true },
  );

  cached = next;
  cachedAtMs = Date.now();
  onSettingsChanged?.();
  return toPublic(next, doc.updatedAt);
}

export function clearAiSettingsCache(): void {
  cached = null;
  cachedAtMs = 0;
}

/** Sync peek at cached settings (null until first load). */
export function peekRuntimeAiSettings(): RuntimeAiSettings | null {
  return cached;
}
