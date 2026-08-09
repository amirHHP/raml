import { useEffect, useRef, useState } from 'react';
import { useWordTypewriter } from '../hooks/useWordTypewriter';
import { formatEnergyCountdown } from '../utils/formatCountdown';

const DEPLETED_COPY =
  'نفست بریده.\nنیرویی برای برداشتن قدم بعدی نداری.\n\nمی‌توانی صبر کنی تا انرژی‌ات برگردد…\nیا راه میان‌بر بگیری.';

export function EnergyDepletedScreen({
  msUntilNextEnergy,
  energyRegenMinutes,
  refillPriceTomans,
  busy,
  onWatchAd,
  onBuyRefill,
  onTimerElapsed,
}: {
  msUntilNextEnergy: number;
  energyRegenMinutes: number;
  refillPriceTomans: number | null;
  busy: boolean;
  onWatchAd: () => void;
  onBuyRefill: () => void;
  onTimerElapsed: () => void;
}) {
  const { displayed, done, skip } = useWordTypewriter(DEPLETED_COPY, 700);
  const remaining = useLocalCountdown(msUntilNextEnergy, onTimerElapsed);
  const priceLabel =
    refillPriceTomans != null
      ? `${refillPriceTomans.toLocaleString('fa-IR')} تومان`
      : null;

  return (
    <div className="px-5 pb-6 pt-2">
      <button
        type="button"
        onClick={skip}
        className="mb-8 w-full text-center"
        aria-label="متن خستگی"
      >
        <p className="whitespace-pre-wrap text-[15px] leading-8 text-ink-dim">
          {displayed}
          {!done && (
            <span className="mr-0.5 inline-block w-1.5 animate-pulse bg-ink-muted align-middle">
              {' '}
            </span>
          )}
        </p>
      </button>

      <div
        className={`flex flex-col items-stretch gap-5 transition-opacity duration-700 ease-out ${
          done ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="text-center">
          <p className="text-[11px] tracking-wide text-ink-muted">
            انرژی بعدی تا
          </p>
          <p className="mt-2 font-mono text-3xl tabular-nums text-amber amber-text-glow">
            {formatEnergyCountdown(remaining)}
          </p>
          <p className="mt-2 text-[11px] text-ink-muted">
            هر {energyRegenMinutes.toLocaleString('fa-IR')} دقیقه یک واحد
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={onWatchAd}
            className="w-full border border-amber/50 py-3.5 text-sm text-amber transition enabled:active:opacity-70 disabled:opacity-40"
          >
            تماشای تبلیغ ادیوری — +۵ انرژی
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onBuyRefill}
            className="w-full border border-line py-3.5 text-sm text-ink transition enabled:active:opacity-70 disabled:opacity-40"
          >
            پر کردن کامل انرژی
            {priceLabel ? (
              <span className="mt-1 block text-[11px] text-ink-muted">
                {priceLabel}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tick down from server msUntilNext; fire once when it hits zero. */
function useLocalCountdown(msUntilNext: number, onElapsed: () => void): number {
  const [remaining, setRemaining] = useState(msUntilNext);
  const baseMs = useRef(msUntilNext);
  const syncedAt = useRef(Date.now());
  const fired = useRef(false);
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;

  useEffect(() => {
    baseMs.current = msUntilNext;
    syncedAt.current = Date.now();
    fired.current = msUntilNext <= 0;
    setRemaining(Math.max(0, msUntilNext));
  }, [msUntilNext]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const left = Math.max(0, baseMs.current - (Date.now() - syncedAt.current));
      setRemaining(left);
      if (left <= 0 && !fired.current) {
        fired.current = true;
        onElapsedRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  return remaining;
}
