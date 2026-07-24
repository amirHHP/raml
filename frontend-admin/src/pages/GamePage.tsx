import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { GameSettings } from '../types';

export function GamePage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [storyMsPerWord, setStoryMsPerWord] = useState(400);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getGame()
      .then((s) => {
        if (cancelled) return;
        setSettings(s);
        setStoryMsPerWord(s.storyMsPerWord);
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
      const s = await adminApi.putGame({ storyMsPerWord });
      setSettings(s);
      setStoryMsPerWord(s.storyMsPerWord);
      setMessage('تنظیمات بازی ذخیره شد');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!settings && !error) {
    return <p className="text-ink-dim">در حال بارگذاری...</p>;
  }

  // Higher UI "speed" = lower ms/word
  const speedLabel =
    storyMsPerWord <= 150
      ? 'خیلی سریع'
      : storyMsPerWord <= 300
        ? 'سریع'
        : storyMsPerWord <= 500
          ? 'متوسط'
          : storyMsPerWord <= 900
            ? 'آرام'
            : 'خیلی آرام';

  return (
    <form
      onSubmit={(e) => void save(e)}
      className="max-w-xl space-y-4 rounded-xl border border-line bg-sand/70 p-5"
    >
      <h2 className="text-lg font-medium">تنظیمات بازی</h2>
      <p className="text-sm leading-6 text-ink-dim">
        سرعت نوشتن متن داستان (تایپ‌رایتر). عدد کمتر = نوشتن سریع‌تر.
      </p>

      <label className="block text-sm text-ink-dim">
        میلی‌ثانیه برای هر کلمه: {storyMsPerWord}
        <span className="mr-2 text-amber">({speedLabel})</span>
        <div dir="ltr" className="mt-3">
          <input
            type="range"
            min={80}
            max={2000}
            step={10}
            value={storyMsPerWord}
            onChange={(e) => setStoryMsPerWord(Number(e.target.value))}
            className="w-full accent-amber"
          />
          <div className="mt-1 flex justify-between text-[11px] text-ink-muted">
            <span>سریع (۸۰)</span>
            <span>آرام (۲۰۰۰)</span>
          </div>
        </div>
      </label>

      <label className="block text-sm text-ink-dim">
        مقدار دقیق
        <input
          type="number"
          min={80}
          max={2000}
          step={10}
          value={storyMsPerWord}
          onChange={(e) => setStoryMsPerWord(Number(e.target.value))}
          className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
        />
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
