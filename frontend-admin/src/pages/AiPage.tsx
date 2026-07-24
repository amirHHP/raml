import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { AiSettings } from '../types';

export function AiPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [useMockAi, setUseMockAi] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <form onSubmit={(e) => void save(e)} className="max-w-xl space-y-4 rounded-xl border border-line bg-sand/70 p-5">
      <h2 className="text-lg font-medium">تنظیمات هوش مصنوعی</h2>
      <p className="text-sm text-ink-dim">
        کلید فعلی:{' '}
        <span className="text-amber">
          {settings?.openaiApiKeySet ? settings.openaiApiKeyMasked : 'تنظیم نشده'}
        </span>
      </p>

      <label className="block text-sm text-ink-dim">
        API Key جدید (خالی بگذارید تا همان قبلی بماند)
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
          placeholder="sk-..."
        />
      </label>

      <label className="block text-sm text-ink-dim">
        Base URL
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
        />
      </label>

      <label className="block text-sm text-ink-dim">
        مدل
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useMockAi}
          onChange={(e) => setUseMockAi(e.target.checked)}
        />
        استفاده از Mock AI (بدون فراخوانی واقعی)
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
