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
  tokenbazaarApiKey: string;
  tokenbazaarBaseUrl: string;
  imageModel: string;
  imageQuality: string;
  imageSize: string;
  imageMode: string;
  useMockImageGen: boolean;
};

type PublicAiSettings = {
  openaiApiKeyMasked: string;
  openaiApiKeySet: boolean;
  openaiBaseUrl: string;
  openaiModel: string;
  useMockAi: boolean;
  tokenbazaarApiKeyMasked: string;
  tokenbazaarApiKeySet: boolean;
  tokenbazaarBaseUrl: string;
  imageModel: string;
  imageQuality: string;
  imageSize: string;
  imageMode: string;
  useMockImageGen: boolean;
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
    tokenbazaarApiKey: config.tokenbazaarApiKey,
    tokenbazaarBaseUrl: config.tokenbazaarBaseUrl,
    imageModel: config.imageModel,
    imageQuality: config.imageQuality,
    imageSize: config.imageSize,
    imageMode: config.imageMode,
    useMockImageGen: config.useMockImageGen,
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
    tokenbazaarApiKeyMasked: maskApiKey(settings.tokenbazaarApiKey),
    tokenbazaarApiKeySet: Boolean(settings.tokenbazaarApiKey),
    tokenbazaarBaseUrl: settings.tokenbazaarBaseUrl,
    imageModel: settings.imageModel,
    imageQuality: settings.imageQuality,
    imageSize: settings.imageSize,
    imageMode: settings.imageMode,
    useMockImageGen: settings.useMockImageGen,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
    provider: detectProvider(settings),
    aiLiveFromTurn: AI_LIVE_FROM_TURN,
  };
}

function finalize(settings: RuntimeAiSettings): RuntimeAiSettings {
  let openaiBaseUrl = settings.openaiBaseUrl.trim() || 'https://api.openai.com/v1';
  const openaiApiKey = settings.openaiApiKey;
  // Gemini keys work via Google's OpenAI-compatible endpoint
  if (
    looksLikeGeminiApiKey(openaiApiKey) &&
    (/api\.openai\.com/i.test(openaiBaseUrl) || !openaiBaseUrl)
  ) {
    openaiBaseUrl = GEMINI_OPENAI_BASE_URL;
  }
  if (isGeminiBaseUrl(openaiBaseUrl) && !openaiBaseUrl.endsWith('/')) {
    openaiBaseUrl = `${openaiBaseUrl}/`;
  }
  const openaiModel =
    settings.openaiModel.trim() ||
    (isGeminiBaseUrl(openaiBaseUrl) ? 'gemini-2.0-flash' : 'gpt-4o-mini');
  const useMockAi = !openaiApiKey ? true : settings.useMockAi;

  const tokenbazaarApiKey = settings.tokenbazaarApiKey.trim();
  const tokenbazaarBaseUrl = settings.tokenbazaarBaseUrl.trim() || 'https://api.tokenbazaar.ai/v1';
  const imageModel = settings.imageModel.trim() || 'flux-2-pro';
  const imageQuality = settings.imageQuality.trim() || 'medium';
  const imageSize = settings.imageSize.trim() || '1024x1024';
  const imageMode = settings.imageMode.trim() || 'generation';
  const useMockImageGen = settings.useMockImageGen;

  return {
    openaiApiKey,
    openaiBaseUrl,
    openaiModel,
    useMockAi,
    tokenbazaarApiKey,
    tokenbazaarBaseUrl,
    imageModel,
    imageQuality,
    imageSize,
    imageMode,
    useMockImageGen,
  };
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
    tokenbazaarApiKey: doc.tokenbazaarApiKey?.trim() ? doc.tokenbazaarApiKey : config.tokenbazaarApiKey,
    tokenbazaarBaseUrl: doc.tokenbazaarBaseUrl || config.tokenbazaarBaseUrl,
    imageModel: doc.imageModel || config.imageModel,
    imageQuality: doc.imageQuality || config.imageQuality,
    imageSize: doc.imageSize || config.imageSize,
    imageMode: doc.imageMode || config.imageMode,
    useMockImageGen:
      typeof doc.useMockImageGen === 'boolean' ? doc.useMockImageGen : config.useMockImageGen,
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
  tokenbazaarApiKey?: string;
  tokenbazaarBaseUrl?: string;
  imageModel?: string;
  imageQuality?: string;
  imageSize?: string;
  imageMode?: string;
  useMockImageGen?: boolean;
}): Promise<PublicAiSettings> {
  const current = await getRuntimeAiSettings();

  let openaiApiKey = current.openaiApiKey;
  if (input.openaiApiKey !== undefined) {
    openaiApiKey = input.openaiApiKey;
  }

  let tokenbazaarApiKey = current.tokenbazaarApiKey;
  if (input.tokenbazaarApiKey !== undefined) {
    tokenbazaarApiKey = input.tokenbazaarApiKey;
  }

  const useMockAi =
    input.useMockAi !== undefined
      ? input.useMockAi
      : input.openaiApiKey && input.openaiApiKey.trim()
        ? false
        : current.useMockAi;

  const next = finalize({
    openaiApiKey,
    openaiBaseUrl: input.openaiBaseUrl ?? current.openaiBaseUrl,
    openaiModel: input.openaiModel ?? current.openaiModel,
    useMockAi,
    tokenbazaarApiKey,
    tokenbazaarBaseUrl: input.tokenbazaarBaseUrl ?? current.tokenbazaarBaseUrl,
    imageModel: input.imageModel ?? current.imageModel,
    imageQuality: input.imageQuality ?? current.imageQuality,
    imageSize: input.imageSize ?? current.imageSize,
    imageMode: input.imageMode ?? current.imageMode,
    useMockImageGen: input.useMockImageGen ?? current.useMockImageGen,
  });

  if (useMemory) {
    memorySettings = next;
    cached = next;
    cachedAtMs = Date.now();
    onSettingsChanged?.();
    return toPublic(next, new Date());
  }

  const doc = await AdminSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      $set: {
        openaiApiKey: next.openaiApiKey,
        openaiBaseUrl: next.openaiBaseUrl,
        openaiModel: next.openaiModel,
        useMockAi: next.useMockAi,
        tokenbazaarApiKey: next.tokenbazaarApiKey,
        tokenbazaarBaseUrl: next.tokenbazaarBaseUrl,
        imageModel: next.imageModel,
        imageQuality: next.imageQuality,
        imageSize: next.imageSize,
        imageMode: next.imageMode,
        useMockImageGen: next.useMockImageGen,
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
