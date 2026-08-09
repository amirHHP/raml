import { useCallback, useEffect, useState } from 'react';
import { showRewardedVideo } from '../../monetization/ads';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAd = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await showRewardedVideo();
    setLoading(false);

    if (result.watched) {
      onComplete();
    } else {
      setError(
        result.error || 'پخش تبلیغ به اتمام نرسید. برای دریافت انرژی باید تبلیغ تا انتها دیده شود.'
      );
    }
  }, [onComplete]);

  useEffect(() => {
    if (open) {
      void startAd();
    } else {
      setLoading(false);
      setError(null);
    }
  }, [open, startAd]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-panel p-6 shadow-2xl">
        <h3 className="text-base font-semibold text-ink">تبلیغ پاداش‌دار ادیوری (Adivery)</h3>

        {loading && (
          <div className="mt-6 flex flex-col items-center justify-center gap-4 py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber border-t-transparent" />
            <p className="text-xs text-ink-muted">در حال دریافت و پخش تبلیغ از ادیوری...</p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 p-4 text-right">
            <p className="text-xs leading-6 text-amber">{error}</p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={busy || loading}
            onClick={onClose}
            className="flex-1 rounded-xl border border-line py-2.5 text-xs text-ink-dim transition active:opacity-70 disabled:opacity-40"
          >
            بستن
          </button>

          {error && (
            <button
              type="button"
              disabled={busy || loading}
              onClick={() => void startAd()}
              className="flex-1 rounded-xl border border-amber bg-amber/10 py-2.5 text-xs text-amber transition active:opacity-70 disabled:opacity-40"
            >
              تلاش مجدد
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
