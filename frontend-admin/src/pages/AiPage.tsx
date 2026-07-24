import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { AiSettings, GeminiModelInfo } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai/';

export function AiPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [useMockAi, setUseMockAi] = useState(true);
  const [models, setModels] = useState<GeminiModelInfo[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

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
        setMessage(`${result.models.length} مدل Gemini بارگذاری شد (ریت‌لیمیت Free tier)`);
        if (!result.models.some((m) => m.id === model) && result.models[0]) {
          setModel(result.models[0].id);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingModels(false);
    }
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const body: {
        openaiApiKey?: string;
        openaiBaseUrl: string;
        openaiModel: string;
        useMockAi: boolean;
      } = {
        openaiBaseUrl: baseUrl.trim(),
        openaiModel: model.trim(),
        useMockAi,
      };
      if (apiKey.trim()) body.openaiApiKey = apiKey.trim();
      const s = await adminApi.putAi(body);
      setSettings(s);
      setBaseUrl(s.openaiBaseUrl);
      setModel(s.openaiModel);
      setApiKey('');
      setUseMockAi(s.useMockAi);
      setMessage('تنظیمات ذخیره شد');
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
      <p className="rounded-md border border-line/60 bg-sand-2/50 px-3 py-2 text-xs leading-6 text-ink-dim">
        چهار نوبت اول بازی آفلاین (Mock) است؛ از نوبت{' '}
        <span className="text-amber">{liveFrom}</span> به بعد — اگر کلید تنظیم باشد و Mock
        خاموش باشد — با AI واقعی ادامه می‌یابد.
      </p>

      <label className="block text-sm text-ink-dim">
        API Key جدید (Gemini یا OpenAI — خالی بگذارید تا همان قبلی بماند)
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
          placeholder="AIza... یا sk-..."
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loadingModels || (!apiKey.trim() && !settings?.openaiApiKeySet)}
          onClick={() => void loadGeminiModels()}
          className="rounded-md border border-amber/40 px-3 py-2 text-sm text-amber disabled:opacity-50"
        >
          {loadingModels ? 'در حال دریافت مدل‌ها...' : 'نمایش مدل‌های Gemini + ریت‌لیمیت'}
        </button>
        <button
          type="button"
          onClick={() => {
            setBaseUrl(GEMINI_BASE);
            if (!model.startsWith('gemini')) setModel('gemini-2.0-flash');
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
          مدل Gemini
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

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useMockAi}
          onChange={(e) => setUseMockAi(e.target.checked)}
        />
        استفاده از Mock AI کامل (همیشه آفلاین — حتی بعد از نوبت {liveFrom})
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
      >
        {busy ? 'در حال ذخیره...' : 'ذخیره'}
      </button>
    </form>
  );
}
