/** Gemini OpenAI-compatible endpoint used by the existing OpenAI SDK client. */
export const GEMINI_OPENAI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/openai/';

export const GEMINI_MODELS_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

/** Free-tier rate limits (RPM / TPM / RPD). Matched by longest prefix first. */
const FREE_TIER_LIMITS: Array<{
  prefix: string;
  rpm: number;
  tpm: number | null;
  rpd: number;
  note?: string;
}> = [
  // Longer / more specific prefixes first
  { prefix: 'gemini-2.5-flash-lite', rpm: 15, tpm: 250_000, rpd: 1_000 },
  { prefix: 'gemini-2.5-pro', rpm: 5, tpm: 250_000, rpd: 100 },
  { prefix: 'gemini-2.5-flash', rpm: 10, tpm: 250_000, rpd: 250 },
  { prefix: 'gemini-2.0-flash-lite', rpm: 30, tpm: 1_000_000, rpd: 200 },
  { prefix: 'gemini-2.0-flash', rpm: 15, tpm: 1_000_000, rpd: 200 },
  { prefix: 'gemini-1.5-flash-8b', rpm: 15, tpm: 400_000, rpd: 1_500 },
  { prefix: 'gemini-1.5-flash', rpm: 15, tpm: 1_000_000, rpd: 1_500 },
  { prefix: 'gemini-1.5-pro', rpm: 2, tpm: 32_000, rpd: 50 },
  { prefix: 'gemini-3.1-flash-lite', rpm: 15, tpm: 250_000, rpd: 500 },
  { prefix: 'gemini-3.1-flash', rpm: 10, tpm: 250_000, rpd: 250 },
  { prefix: 'gemini-3-flash', rpm: 10, tpm: 250_000, rpd: 250 },
  { prefix: 'gemini-flash-lite', rpm: 15, tpm: 250_000, rpd: 500 },
  { prefix: 'gemini-flash', rpm: 10, tpm: 250_000, rpd: 250 },
  { prefix: 'gemini-pro', rpm: 15, tpm: 32_000, rpd: 1_500 },
  // Gemma — free tier is often tight on TPM (community reports ~16K TPM)
  { prefix: 'gemma-4', rpm: 15, tpm: 16_000, rpd: 1_500, note: 'لیمیت پایین TPM' },
  { prefix: 'gemma-3', rpm: 15, tpm: 15_000, rpd: 1_500, note: 'لیمیت پایین' },
  { prefix: 'gemma-2', rpm: 15, tpm: 15_000, rpd: 1_500 },
  { prefix: 'gemma', rpm: 15, tpm: 15_000, rpd: 1_500, note: 'لیمیت پایین' },
];

export type GeminiRateLimit = {
  rpm: number | null;
  tpm: number | null;
  rpd: number | null;
  label: string;
  tier: 'free';
};

export type GeminiModelInfo = {
  id: string;
  displayName: string;
  description: string;
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
  rateLimit: GeminiRateLimit;
};

type GoogleModel = {
  name?: string;
  displayName?: string;
  description?: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
};

function stripModelsPrefix(name: string): string {
  return name.replace(/^models\//, '');
}

export function lookupGeminiRateLimit(modelId: string): GeminiRateLimit {
  const id = stripModelsPrefix(modelId).toLowerCase();
  // Longest matching prefix wins
  const match = [...FREE_TIER_LIMITS]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((row) => id.startsWith(row.prefix));
  if (!match) {
    return {
      rpm: null,
      tpm: null,
      rpd: null,
      label: 'نامشخص (Free tier) — در AI Studio ببینید',
      tier: 'free',
    };
  }
  const tpmPart = match.tpm == null ? 'TPM نامحدود' : `${formatCount(match.tpm)} TPM`;
  const note = match.note ? ` · ${match.note}` : '';
  return {
    rpm: match.rpm,
    tpm: match.tpm,
    rpd: match.rpd,
    label: `${match.rpm} RPM · ${tpmPart} · ${formatCount(match.rpd)} RPD${note}`,
    tier: 'free',
  };
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}K`;
  return String(n);
}

export function isGeminiBaseUrl(baseUrl: string): boolean {
  return /generativelanguage\.googleapis\.com/i.test(baseUrl);
}

export function looksLikeGeminiApiKey(key: string): boolean {
  return key.trim().startsWith('AIza');
}

function isGenerativeModel(model: GoogleModel): boolean {
  const methods = model.supportedGenerationMethods || [];
  if (!methods.includes('generateContent')) return false;
  const id = stripModelsPrefix(model.name || '').toLowerCase();
  if (
    id.includes('embedding') ||
    id.includes('aqa') ||
    id.includes('imagen') ||
    id.includes('tts') ||
    id.includes('robotics')
  ) {
    return false;
  }
  return id.startsWith('gemini') || id.startsWith('gemma');
}

export async function listGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  const key = apiKey.trim();
  if (!key) throw Object.assign(new Error('کلید Gemini تنظیم نشده'), { status: 400 });

  const url = `${GEMINI_MODELS_URL}?key=${encodeURIComponent(key)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const msg =
      res.status === 400 || res.status === 403
        ? 'کلید Gemini نامعتبر است یا دسترسی ندارد'
        : `خطا در دریافت مدل‌های Gemini (${res.status})`;
    throw Object.assign(new Error(msg + (body ? `: ${body.slice(0, 180)}` : '')), {
      status: 502,
    });
  }

  const data = (await res.json()) as { models?: GoogleModel[] };
  const models = (data.models || [])
    .filter(isGenerativeModel)
    .map((m): GeminiModelInfo => {
      const id = stripModelsPrefix(m.name || '');
      return {
        id,
        displayName: m.displayName || id,
        description: m.description || '',
        inputTokenLimit: m.inputTokenLimit ?? null,
        outputTokenLimit: m.outputTokenLimit ?? null,
        rateLimit: lookupGeminiRateLimit(id),
      };
    })
    .sort((a, b) => {
      // Known limits first, then gemma/gemini flash family, then alpha
      const rank = (m: GeminiModelInfo) => {
        let r = 0;
        if (m.rateLimit.rpm != null) r -= 100;
        if (m.id.startsWith('gemma')) r -= 40;
        if (m.id.includes('flash') && !m.id.includes('preview')) r -= 20;
        return r;
      };
      const d = rank(a) - rank(b);
      return d !== 0 ? d : a.id.localeCompare(b.id);
    });

  return models;
}
