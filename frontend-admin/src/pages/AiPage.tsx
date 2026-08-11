import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { AiSettings, GeminiModelInfo } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai/';

function looksLikeApiKey(value: string): boolean {
  const v = value.trim();
  return v.startsWith('AIza') || v.startsWith('AQ.') || v.startsWith('sk-');
}

export function AiPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [useMockAi, setUseMockAi] = useState(true);
  const [tokenbazaarApiKey, setTokenbazaarApiKey] = useState('');
  const [tokenbazaarBaseUrl, setTokenbazaarBaseUrl] = useState('https://api.tokenbazaar.ai/v1');
  const [imageModel, setImageModel] = useState('flux-2-pro');
  const [imageQuality, setImageQuality] = useState('');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [imageMode, setImageMode] = useState('generation');
  const [useMockImageGen, setUseMockImageGen] = useState(false);

  // Image tester state
  const [imagePrompt, setImagePrompt] = useState('A serene koi pond at sunset, ukiyo-e style.');
  const [testQuality, setTestQuality] = useState('');
  const [testSize, setTestSize] = useState('1024x1024');
  const [testMode, setTestMode] = useState('generation');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageGenInfo, setImageGenInfo] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const [models, setModels] = useState<GeminiModelInfo[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getAi()
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setBaseUrl(s.openaiBaseUrl);
        setModel(s.openaiModel);
        setUseMockAi(s.useMockAi);
        if (s.tokenbazaarBaseUrl) setTokenbazaarBaseUrl(s.tokenbazaarBaseUrl);
        if (s.imageModel) setImageModel(s.imageModel);
        if (typeof s.imageQuality === 'string') {
          setImageQuality(s.imageQuality);
          setTestQuality(s.imageQuality);
        }
        if (typeof s.imageSize === 'string') {
          setImageSize(s.imageSize);
          setTestSize(s.imageSize);
        }
        if (typeof s.imageMode === 'string') {
          setImageMode(s.imageMode);
          setTestMode(s.imageMode);
        }
        if (typeof s.useMockImageGen === 'boolean') setUseMockImageGen(s.useMockImageGen);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onApiKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim().startsWith('AIza') && /api\.openai\.com/i.test(baseUrl)) {
      setBaseUrl(GEMINI_BASE);
      if (!model.startsWith('gemini')) setModel('gemini-2.0-flash');
    }
  };

  const loadGeminiModels = async () => {
    setLoadingModels(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminApi.listGeminiModels(
        apiKey.trim() ? apiKey.trim() : undefined,
      );
      setModels(result.models);
      if (result.baseUrlHint && /api\.openai\.com/i.test(baseUrl)) {
        setBaseUrl(result.baseUrlHint);
      }
      if (result.models.length === 0) {
        setMessage('مدلی یافت نشد');
      } else {
        const gemmaCount = result.models.filter((m) => m.id.startsWith('gemma')).length;
        const flash = result.models.find(
          (m) =>
            m.id.startsWith('gemini') &&
            m.id.includes('flash') &&
            !m.id.includes('preview'),
        );
        // Prefer a Gemini Flash default — Gemma ranks high in Google's list but
        // is a poor fit for structured game JSON (low TPM / flaky options).
        if (!result.models.some((m) => m.id === model)) {
          const preferred =
            flash?.id ||
            result.models.find((m) => m.id.startsWith('gemini'))?.id ||
            result.models[0]?.id;
          if (preferred) setModel(preferred);
        }
        setMessage(
          `${result.models.length} مدل از Google دریافت شد` +
            (gemmaCount ? ` (شامل ${gemmaCount} مدل Gemma — برای بازی Gemini Flash بهتر است)` : ''),
        );
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingModels(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminApi.testAi();
      if (result.ok) {
        setMessage(
          `اتصال OK — مدل ${result.model} در ${result.ms}ms پاسخ داد`,
        );
      } else {
        setError(result.error || 'تست ناموفق');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setTesting(false);
    }
  };

  const testGenerateImage = async () => {
    setGeneratingImage(true);
    setImageError(null);
    setImageGenInfo(null);
    setGeneratedImageUrl(null);
    try {
      const result = await adminApi.generateImage({
        prompt: imagePrompt,
        model: imageModel,
        size: testSize,
        quality: testQuality,
        mode: testMode,
      });
      if (result.ok) {
        setGeneratedImageUrl(result.imageUrl || (result.b64_json ? `data:image/png;base64,${result.b64_json}` : null));
        setImageGenInfo(`تصویر در ${result.ms}ms با موفقیت ساخت شد (مدل: ${result.model} | کیفیت: ${result.quality} | ابعاد: ${result.size})`);
      } else {
        setImageError(result.error || 'خطا در ساخت تصویر');
      }
    } catch (err) {
      setImageError((err as Error).message);
    } finally {
      setGeneratingImage(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const trimmedKey = apiKey.trim();
      const trimmedTbKey = tokenbazaarApiKey.trim();
      if (trimmedKey && !looksLikeApiKey(trimmedKey)) {
        setError(
          'این شبیه کلید Gemini (AIza…) یا OpenAI (sk-…) نیست. اگر مرورگر رمز ادمین را اینجا پر کرده، فیلد را پاک کنید.',
        );
        return;
      }

      const body: {
        openaiApiKey?: string;
        openaiBaseUrl: string;
        openaiModel: string;
        useMockAi: boolean;
        tokenbazaarApiKey?: string;
        tokenbazaarBaseUrl: string;
        imageModel: string;
        imageQuality: string;
        imageSize: string;
        imageMode: string;
        useMockImageGen: boolean;
      } = {
        openaiBaseUrl: baseUrl.trim(),
        openaiModel: model.trim(),
        useMockAi,
        tokenbazaarBaseUrl: tokenbazaarBaseUrl.trim(),
        imageModel: imageModel.trim(),
        imageQuality,
        imageSize,
        imageMode,
        useMockImageGen,
      };
      if (trimmedKey) body.openaiApiKey = trimmedKey;
      if (trimmedTbKey) body.tokenbazaarApiKey = trimmedTbKey;

      const s = await adminApi.putAi(body);
      setSettings(s);
      setBaseUrl(s.openaiBaseUrl);
      setModel(s.openaiModel);
      setApiKey('');
      setTokenbazaarApiKey('');
      setUseMockAi(s.useMockAi);
      if (s.tokenbazaarBaseUrl) setTokenbazaarBaseUrl(s.tokenbazaarBaseUrl);
      if (s.imageModel) setImageModel(s.imageModel);
      if (s.imageQuality) setImageQuality(s.imageQuality);
      if (s.imageSize) setImageSize(s.imageSize);
      if (s.imageMode) setImageMode(s.imageMode);
      if (typeof s.useMockImageGen === 'boolean') setUseMockImageGen(s.useMockImageGen);

      setMessage('تنظیمات هوش مصنوعی (متن و تصویر) ذخیره شد');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!settings && !error) {
    return <p className="text-ink-dim">در حال بارگذاری...</p>;
  }

  const selected = models.find((m) => m.id === model);
  const liveFrom = settings?.aiLiveFromTurn ?? 5;
  const modelLooksGemma = model.trim().toLowerCase().startsWith('gemma');

  return (
    <form onSubmit={(e) => void save(e)} className="max-w-xl space-y-4 rounded-xl border border-line bg-sand/70 p-5">
      <h2 className="text-lg font-medium">تنظیمات هوش مصنوعی</h2>
      <p className="text-sm text-ink-dim">
        کلید فعلی:{' '}
        <span className="text-amber">
          {settings?.openaiApiKeySet ? settings.openaiApiKeyMasked : 'تنظیم نشده'}
        </span>
        {settings?.provider === 'gemini' && (
          <span className="mr-2 text-emerald-400"> · Gemini</span>
        )}
      </p>
      {settings?.updatedAt && (
        <p className="text-xs text-ink-muted">
          آخرین ذخیره:{' '}
          {new Date(settings.updatedAt).toLocaleString('fa-IR')}
        </p>
      )}
      <p className="rounded-md border border-line/60 bg-sand-2/50 px-3 py-2 text-xs leading-6 text-ink-dim">
        چهار نوبت اول بازی آفلاین (Mock) است؛ از نوبت{' '}
        <span className="text-amber">{liveFrom}</span> به بعد — اگر کلید تنظیم باشد و Mock
        خاموش باشد — با AI واقعی ادامه می‌یابد.
      </p>
      {!settings?.openaiApiKeySet && (
        <p className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-xs leading-6 text-amber">
          بدون کلید API، بازی حتی بعد از نوبت {liveFrom} هم روی Mock می‌ماند و داستان تکراری
          می‌شود. کلید Gemini یا OpenAI را ذخیره کنید و تیک «Mock کامل» را بردارید.
        </p>
      )}

      <label className="block text-sm text-ink-dim">
        API Key جدید (Gemini یا OpenAI — خالی بگذارید تا همان قبلی بماند)
        <input
          type="password"
          name="raml-ai-api-key"
          autoComplete="new-password"
          data-1p-ignore
          data-lpignore="true"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
          placeholder="AIza... یا sk-..."
        />
      </label>
      {apiKey.trim() && !looksLikeApiKey(apiKey) && (
        <p className="text-xs text-amber">
          این مقدار شبیه کلید API نیست — مراقب autofill مرورگر باشید.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loadingModels || (!apiKey.trim() && !settings?.openaiApiKeySet)}
          onClick={() => void loadGeminiModels()}
          className="rounded-md border border-amber/40 px-3 py-2 text-sm text-amber disabled:opacity-50"
        >
          {loadingModels ? 'در حال دریافت مدل‌ها...' : 'مدل‌های Gemini/Gemma + ریت‌لیمیت'}
        </button>
        <button
          type="button"
          disabled={testing || !settings?.openaiApiKeySet || useMockAi}
          onClick={() => void testConnection()}
          className="rounded-md border border-emerald-500/40 px-3 py-2 text-sm text-emerald-400 disabled:opacity-50"
        >
          {testing ? 'در حال تست...' : 'تست اتصال AI'}
        </button>
        <button
          type="button"
          onClick={() => {
            setBaseUrl(GEMINI_BASE);
            if (!model.startsWith('gemini') && !model.startsWith('gemma')) {
              setModel('gemini-2.0-flash');
            }
          }}
          className="rounded-md border border-line px-3 py-2 text-sm text-ink-dim"
        >
          پیش‌فرض Gemini
        </button>
      </div>

      <label className="block text-sm text-ink-dim">
        Base URL
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
        />
      </label>

      {models.length > 0 ? (
        <label className="block text-sm text-ink-dim">
          مدل Gemini / Gemma
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.displayName} — {m.rateLimit.label}
              </option>
            ))}
          </select>
          {selected && (
            <p className="mt-2 text-xs leading-5 text-ink-dim">
              <span className="text-amber">{selected.id}</span>
              {' · '}
              Free tier: {selected.rateLimit.label}
              {selected.inputTokenLimit != null && (
                <> · ورودی تا {selected.inputTokenLimit.toLocaleString('fa-IR')} توکن</>
              )}
            </p>
          )}
        </label>
      ) : (
        <label className="block text-sm text-ink-dim">
          مدل
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            placeholder="gemini-2.0-flash"
          />
        </label>
      )}

      {modelLooksGemma && (
        <p className="rounded-md border border-amber/40 bg-amber/10 px-3 py-2 text-xs leading-6 text-amber">
          مدل‌های Gemma از لیست Google می‌آیند ولی برای رمل مناسب نیستند: TPM پایین و JSON
          گزینه‌ها اغلب ناقص می‌شود. برای استاد بازی،{' '}
          <span className="font-medium">gemini-2.0-flash</span> را انتخاب کنید.
        </p>
      )}

      <hr className="my-6 border-line/60" />

      {/* TokenBazaar Image Generation Section */}
      <h3 className="text-md font-medium text-amber">تنظیمات ساخت تصویر با هوش مصنوعی (TokenBazaar AI)</h3>
      <p className="text-xs text-ink-dim">
        کلید فعلی تصویر:{' '}
        <span className="text-amber">
          {settings?.tokenbazaarApiKeySet ? settings.tokenbazaarApiKeyMasked : 'تنظیم نشده'}
        </span>
      </p>

      <label className="block text-sm text-ink-dim">
        TokenBazaar API Key (خالی بگذارید تا همان قبلی بماند)
        <input
          type="password"
          name="raml-tokenbazaar-api-key"
          autoComplete="new-password"
          data-1p-ignore
          data-lpignore="true"
          value={tokenbazaarApiKey}
          onChange={(e) => setTokenbazaarApiKey(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
          placeholder="tb_live_... یا sk-..."
        />
      </label>

      <label className="block text-sm text-ink-dim">
        TokenBazaar Base URL
        <input
          value={tokenbazaarBaseUrl}
          onChange={(e) => setTokenbazaarBaseUrl(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
          placeholder="https://api.tokenbazaar.ai/v1"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm text-ink-dim">
          مدل تصویر (Model)
          <input
            value={imageModel}
            onChange={(e) => setImageModel(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            placeholder="flux-2-pro"
          />
        </label>

        <label className="block text-sm text-ink-dim">
          کیفیت پیش‌فرض (Quality)
          <input
            type="text"
            value={imageQuality}
            onChange={(e) => setImageQuality(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            placeholder="low / medium / high یا مقدار دلخواه"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm text-ink-dim">
          ابعاد / رزولوشن (Resolution / Size)
          <input
            type="text"
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            placeholder="1024x1024 / 1024x1536 یا مقدار دلخواه"
          />
        </label>

        <label className="block text-sm text-ink-dim">
          حالت کارکرد (Mode)
          <input
            type="text"
            value={imageMode}
            onChange={(e) => setImageMode(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            placeholder="generation / edit یا مقدار دلخواه"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useMockImageGen}
          onChange={(e) => setUseMockImageGen(e.target.checked)}
        />
        حالت Mock ساخت تصویر (بدون مصرف توکن)
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
      >
        {busy ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
      </button>

      {/* Interactive AI Image Tester */}
      <div className="mt-8 rounded-lg border border-amber/30 bg-sand-2/40 p-4 space-y-3">
        <h4 className="text-sm font-medium text-amber flex items-center justify-between">
          <span>تست ساخت تصویر آنلاین (TokenBazaar Playground)</span>
          <span className="text-xs text-ink-muted dir-ltr">Endpoint: /v1/images/generations</span>
        </h4>
        
        <label className="block text-xs text-ink-dim">
          پرامپت (Prompt)
          <textarea
            rows={2}
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-xs text-ink outline-none focus:border-amber"
            placeholder="A serene koi pond at sunset, ukiyo-e style."
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <label className="text-xs text-ink-dim">
            کیفیت (quality)
            <input
              type="text"
              value={testQuality}
              onChange={(e) => setTestQuality(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-sand-2 px-2 py-1.5 text-xs text-ink outline-none focus:border-amber"
              placeholder="low / medium / high"
            />
          </label>

          <label className="text-xs text-ink-dim">
            رزولوشن (size)
            <input
              type="text"
              value={testSize}
              onChange={(e) => setTestSize(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-sand-2 px-2 py-1.5 text-xs text-ink outline-none focus:border-amber"
              placeholder="1024x1024"
            />
          </label>

          <label className="text-xs text-ink-dim">
            حالت (mode)
            <input
              type="text"
              value={testMode}
              onChange={(e) => setTestMode(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-sand-2 px-2 py-1.5 text-xs text-ink outline-none focus:border-amber"
              placeholder="generation / edit"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-ink-muted dir-ltr font-mono">
            {testQuality === 'low' && testSize === '1024x1024' && 'quality=low · resolution=1024x1024 → $0.0036 / image'}
            {testQuality === 'low' && testSize === '1024x1536' && 'quality=low · resolution=1024x1536 → $0.0054 / image'}
            {testQuality === 'low' && testSize === '1536x1024' && 'quality=low · resolution=1536x1024 → $0.0053 / image'}
            {testQuality === 'medium' && testSize === '1024x1024' && 'resolution=1024x1024 → $0.0318 / image'}
            {testQuality === 'medium' && testSize === '1024x1536' && 'resolution=1024x1536 → $0.0477 / image'}
            {testQuality === 'medium' && testSize === '1536x1024' && 'resolution=1536x1024 → $0.0473 / image'}
            {testQuality === 'high' && testSize === '1024x1024' && 'quality=high · resolution=1024x1024 → $0.1266 / image'}
            {testQuality === 'high' && testSize === '1024x1536' && 'quality=high · resolution=1024x1536 → $0.1899 / image'}
            {testQuality === 'high' && testSize === '1536x1024' && 'quality=high · resolution=1536x1024 → $0.1890 / image'}
            {!['low', 'medium', 'high'].includes(testQuality) && `quality=${testQuality} · resolution=${testSize} · mode=${testMode}`}
          </div>

          <button
            type="button"
            disabled={generatingImage || !imagePrompt.trim()}
            onClick={() => void testGenerateImage()}
            className="rounded-md border border-amber bg-amber/20 px-4 py-1.5 text-xs font-medium text-amber hover:bg-amber/30 disabled:opacity-50"
          >
            {generatingImage ? 'در حال تولید...' : 'تولید تصویر با AI'}
          </button>
        </div>

        {imageGenInfo && <p className="text-xs text-emerald-400">{imageGenInfo}</p>}
        {imageError && <p className="text-xs text-red-400">{imageError}</p>}

        {generatedImageUrl && (
          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-stone-950 p-2 text-center">
            <img
              src={generatedImageUrl}
              alt="Generated AI result"
              className="max-h-80 mx-auto rounded object-contain"
            />
            <p className="mt-2 text-[10px] text-ink-muted dir-ltr truncate">{generatedImageUrl}</p>
          </div>
        )}
      </div>
    </form>
  );
}
