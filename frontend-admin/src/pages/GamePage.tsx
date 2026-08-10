import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { GameSettings } from '../types';

type UnlockKey =
  | 'unlockInventoryAtTurn'
  | 'unlockStatsAtTurn'
  | 'unlockHpAtTurn'
  | 'unlockManaAtTurn'
  | 'unlockGoldAtTurn';

const UNLOCK_FIELDS: { key: UnlockKey; label: string; hint: string }[] = [
  {
    key: 'unlockInventoryAtTurn',
    label: 'نمایش کوله‌پشتی',
    hint: 'از این مرحله تب کوله‌پشتی باز می‌شود و آیتم‌ها ذخیره می‌شوند',
  },
  {
    key: 'unlockStatsAtTurn',
    label: 'نمایش بخش آمار',
    hint: 'از این مرحله تب آمار باز می‌شود',
  },
  {
    key: 'unlockHpAtTurn',
    label: 'جان (HP)',
    hint: 'از این مرحله جان در UI دیده می‌شود و AI می‌تواند تغییرش دهد',
  },
  {
    key: 'unlockManaAtTurn',
    label: 'مانا',
    hint: 'از این مرحله مانا دیده و تغییر می‌کند',
  },
  {
    key: 'unlockGoldAtTurn',
    label: 'طلا',
    hint: 'از این مرحله طلا دیده و اضافه می‌شود',
  },
];

export function GamePage() {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [storyMsPerWord, setStoryMsPerWord] = useState(400);
  const [unlocks, setUnlocks] = useState<Record<UnlockKey, number>>({
    unlockInventoryAtTurn: 10,
    unlockStatsAtTurn: 20,
    unlockHpAtTurn: 20,
    unlockManaAtTurn: 30,
    unlockGoldAtTurn: 40,
  });
  const [referrerGold, setReferrerGold] = useState(50);
  const [refereeGold, setRefereeGold] = useState(25);
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
        setUnlocks({
          unlockInventoryAtTurn: s.unlockInventoryAtTurn,
          unlockStatsAtTurn: s.unlockStatsAtTurn,
          unlockHpAtTurn: s.unlockHpAtTurn,
          unlockManaAtTurn: s.unlockManaAtTurn,
          unlockGoldAtTurn: s.unlockGoldAtTurn,
        });
        setReferrerGold(s.referralRewardReferrerGold ?? 50);
        setRefereeGold(s.referralRewardRefereeGold ?? 25);
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
      const s = await adminApi.putGame({
        storyMsPerWord,
        ...unlocks,
        referralRewardReferrerGold: referrerGold,
        referralRewardRefereeGold: refereeGold,
      });
      setSettings(s);
      setStoryMsPerWord(s.storyMsPerWord);
      setUnlocks({
        unlockInventoryAtTurn: s.unlockInventoryAtTurn,
        unlockStatsAtTurn: s.unlockStatsAtTurn,
        unlockHpAtTurn: s.unlockHpAtTurn,
        unlockManaAtTurn: s.unlockManaAtTurn,
        unlockGoldAtTurn: s.unlockGoldAtTurn,
      });
      setReferrerGold(s.referralRewardReferrerGold ?? 50);
      setRefereeGold(s.referralRewardRefereeGold ?? 25);
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
      className="max-w-xl space-y-6 rounded-xl border border-line bg-sand/70 p-5"
    >
      <div className="space-y-4">
        <h2 className="text-lg font-medium">تنظیمات بازی</h2>
        <p className="text-sm leading-6 text-ink-dim">
          سرعت نوشتن متن داستان (تایپ‌رایتر). عدد کمتر = نوشتن سریع‌تر.
        </p>

        <label className="block text-sm text-ink-dim">
          میلی‌ثانیه‌ برای هر کلمه: {storyMsPerWord}
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
      </div>

      <div className="space-y-4 border-t border-line pt-5">
        <h3 className="text-base font-medium text-ink">پاداش‌های ریفرال و دعوت از دوستان</h3>
        <p className="text-xs leading-5 text-ink-muted">
          مقدار پاداش سکه طلا که هنگام بیداری دوست جدید به هر دو طرف اعطا می‌شود.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm text-ink-dim">
            پاداش دعوت‌کننده (سکه)
            <input
              type="number"
              min={0}
              max={10000}
              value={referrerGold}
              onChange={(e) => setReferrerGold(Number(e.target.value) || 0)}
              className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            />
            <span className="mt-1 block text-[11px] text-ink-muted">طلا برای کسی که دوستش رو دعوت کرده</span>
          </label>
          <label className="block text-sm text-ink-dim">
            پاداش دعوت‌شده (سکه)
            <input
              type="number"
              min={0}
              max={10000}
              value={refereeGold}
              onChange={(e) => setRefereeGold(Number(e.target.value) || 0)}
              className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            />
            <span className="mt-1 block text-[11px] text-ink-muted">طلا برای دوست جدید موقع شروع بازی</span>
          </label>
        </div>
      </div>

      <div className="space-y-3 border-t border-line pt-5">
        <h3 className="text-base font-medium text-ink">باز شدن قابلیت‌ها بر اساس مرحله</h3>
        <p className="text-xs leading-5 text-ink-muted">
          شماره مرحله‌ای که از آن به بعد هر قابلیت فعال می‌شود (پیش‌فرض‌ها با پرامپت‌های ۱۰…۱۰۰ هم‌خوان‌اند).
        </p>
        {UNLOCK_FIELDS.map(({ key, label, hint }) => (
          <label key={key} className="block text-sm text-ink-dim">
            {label}
            <input
              type="number"
              min={1}
              max={500}
              value={unlocks[key]}
              onChange={(e) =>
                setUnlocks((prev) => ({ ...prev, [key]: Number(e.target.value) || 1 }))
              }
              className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            />
            <span className="mt-1 block text-[11px] text-ink-muted">{hint}</span>
          </label>
        ))}
      </div>

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
