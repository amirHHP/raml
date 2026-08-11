import { getRuntimeAiSettings } from './aiSettings';

export interface ImageGenOptions {
  prompt: string;
  model?: string;
  size?: string;
  n?: number;
  response_format?: 'url' | 'b64_json';
}

export interface ImageGenResult {
  ok: boolean;
  imageUrl?: string;
  b64_json?: string;
  model: string;
  prompt: string;
  size: string;
  ms: number;
  error?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  let cleaned = baseUrl.trim();
  if (cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  if (!cleaned.endsWith('/images/generations')) {
    cleaned = `${cleaned}/images/generations`;
  }
  return cleaned;
}

export function createSvgMockImage(prompt: string): string {
  const encodedPrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b" />
        <stop offset="50%" stop-color="#312e81" />
        <stop offset="100%" stop-color="#4c1d95" />
      </linearGradient>
      <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#d97706" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)" />
    <circle cx="512" cy="512" r="300" fill="none" stroke="url(#accent)" stroke-width="4" opacity="0.3" />
    <circle cx="512" cy="512" r="200" fill="none" stroke="url(#accent)" stroke-width="2" opacity="0.5" />
    <g transform="translate(512, 420)">
      <path d="M-40,-30 L0,-70 L40,-30 L20,-30 L20,40 L-20,40 L-20,-30 Z" fill="url(#accent)" />
    </g>
    <text x="512" y="600" text-anchor="middle" fill="#fcd34d" font-family="sans-serif" font-size="28" font-weight="bold">RAML AI Image Generator (Mock Mode)</text>
    <text x="512" y="660" text-anchor="middle" fill="#e2e8f0" font-family="sans-serif" font-size="20" opacity="0.9">Prompt: ${encodedPrompt.length > 60 ? encodedPrompt.slice(0, 57) + '...' : encodedPrompt}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function generateImage(options: ImageGenOptions): Promise<ImageGenResult> {
  const startedAt = Date.now();
  const settings = await getRuntimeAiSettings();
  const model = options.model?.trim() || settings.imageModel || 'flux-2-pro';
  const size = options.size?.trim() || '1024x1024';
  const prompt = options.prompt.trim();

  if (!prompt) {
    return {
      ok: false,
      model,
      prompt: '',
      size,
      ms: Date.now() - startedAt,
      error: 'متن تصویر (prompt) نمی‌تواند خالی باشد',
    };
  }

  // Use mock mode if explicitly enabled or if no API key is provided
  if (settings.useMockImageGen || !settings.tokenbazaarApiKey) {
    const mockUrl = createSvgMockImage(prompt);
    return {
      ok: true,
      imageUrl: mockUrl,
      model: `${model} (mock)`,
      prompt,
      size,
      ms: Date.now() - startedAt,
    };
  }

  const endpointUrl = normalizeBaseUrl(settings.tokenbazaarBaseUrl);

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.tokenbazaarApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size,
        n: options.n ?? 1,
        response_format: options.response_format ?? 'url',
      }),
    });

    const elapsedMs = Date.now() - startedAt;

    if (!response.ok) {
      let errorMsg = `خطای TokenBazaar (کد HTTP ${response.status})`;
      try {
        const errJson = (await response.json()) as { error?: { message?: string } | string; message?: string };
        if (typeof errJson.error === 'string') {
          errorMsg = errJson.error;
        } else if (errJson.error?.message) {
          errorMsg = errJson.error.message;
        } else if (errJson.message) {
          errorMsg = errJson.message;
        }
      } catch {
        const text = await response.text();
        if (text) errorMsg = text.slice(0, 200);
      }
      return {
        ok: false,
        model,
        prompt,
        size,
        ms: elapsedMs,
        error: errorMsg,
      };
    }

    const data = (await response.json()) as {
      data?: Array<{ url?: string; b64_json?: string }>;
    };

    const firstImage = data.data?.[0];
    if (!firstImage || (!firstImage.url && !firstImage.b64_json)) {
      return {
        ok: false,
        model,
        prompt,
        size,
        ms: elapsedMs,
        error: 'پاسخ دریافتی از سرور تصوری نداشت',
      };
    }

    return {
      ok: true,
      imageUrl: firstImage.url,
      b64_json: firstImage.b64_json,
      model,
      prompt,
      size,
      ms: elapsedMs,
    };
  } catch (err) {
    return {
      ok: false,
      model,
      prompt,
      size,
      ms: Date.now() - startedAt,
      error: (err as Error).message || 'خطا در ارتباط با TokenBazaar AI',
    };
  }
}
