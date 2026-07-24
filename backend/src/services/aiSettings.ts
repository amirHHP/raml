import { config } from '../config';
import { AdminSettings, type IAdminSettings } from '../models/AdminSettings';

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
};

let useMemory = false;
let memorySettings: RuntimeAiSettings | null = null;
let cached: RuntimeAiSettings | null = null;
let onSettingsChanged: (() => void) | null = null;

export function setAiSettingsMemory(value: boolean): void {
  useMemory = value;
  cached = null;
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

function toPublic(settings: RuntimeAiSettings, updatedAt: Date | null): PublicAiSettings {
  return {
    openaiApiKeyMasked: maskApiKey(settings.openaiApiKey),
    openaiApiKeySet: Boolean(settings.openaiApiKey),
    openaiBaseUrl: settings.openaiBaseUrl,
    openaiModel: settings.openaiModel,
    useMockAi: settings.useMockAi,
    updatedAt: updatedAt ? updatedAt.toISOString() : null,
  };
}

function finalize(settings: RuntimeAiSettings): RuntimeAiSettings {
  const openaiBaseUrl = settings.openaiBaseUrl.replace(/\/$/, '') || 'https://api.openai.com/v1';
  const openaiModel = settings.openaiModel.trim() || 'gpt-4o-mini';
  const openaiApiKey = settings.openaiApiKey;
  const useMockAi = !openaiApiKey ? true : settings.useMockAi;
  return { openaiApiKey, openaiBaseUrl, openaiModel, useMockAi };
}

export async function getRuntimeAiSettings(): Promise<RuntimeAiSettings> {
  if (cached) return cached;

  if (useMemory) {
    cached = finalize(memorySettings || fromEnv());
    return cached;
  }

  const doc = await AdminSettings.findOne({ singletonKey: 'default' }).lean<IAdminSettings | null>();
  if (!doc) {
    cached = finalize(fromEnv());
    return cached;
  }

  cached = finalize({
    openaiApiKey: doc.openaiApiKey || config.openaiApiKey,
    openaiBaseUrl: doc.openaiBaseUrl || config.openaiBaseUrl,
    openaiModel: doc.openaiModel || config.openaiModel,
    useMockAi:
      typeof doc.useMockAi === 'boolean' ? doc.useMockAi : config.useMockAi,
  });
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
    onSettingsChanged?.();
    return toPublic(next, new Date());
  }

  const doc = await AdminSettings.findOneAndUpdate(
    { singletonKey: 'default' },
    {
      singletonKey: 'default',
      openaiApiKey: next.openaiApiKey,
      openaiBaseUrl: next.openaiBaseUrl,
      openaiModel: next.openaiModel,
      useMockAi: next.useMockAi,
    },
    { upsert: true, new: true },
  );

  cached = next;
  onSettingsChanged?.();
  return toPublic(next, doc.updatedAt);
}

export function clearAiSettingsCache(): void {
  cached = null;
}
