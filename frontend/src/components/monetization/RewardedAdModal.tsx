import { useEffect, useState } from 'react';

/** Placeholder for Tapsell/Yektanet rewarded video via Capacitor. */
export function RewardedAdModal({
  open,
  busy,
  onClose,
  onComplete,
}: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const id = window.setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          window.clearInterval(id);
          return 100;
        }
        return p + 4;
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [open]);

  if (!open) return null;

  const ready = progress >= 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-5">
        <h3 className="text-base text-ink">تبلیغ پاداش‌دار</h3>
        <p className="mt-2 text-xs leading-6 text-ink-muted">
          این یک ماک SDK است. در نسخهٔ کافه‌بازار به تپسل یا یکتانت وصل می‌شود.
        </p>
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full bg-amber transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-ink-dim">
          {ready ? 'آماده دریافت پاداش' : `در حال پخش... ${progress}%`}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-line py-2 text-sm text-ink-dim"
          >
            بستن
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={onComplete}
            className="flex-1 rounded-lg border border-amber py-2 text-sm text-amber disabled:opacity-40"
          >
            دریافت +۵ انرژی
          </button>
        </div>
      </div>
    </div>
  );
}
