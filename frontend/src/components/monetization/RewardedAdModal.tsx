import { useEffect, useRef, useState } from 'react';
import { showRewardedVideo, simulateAdReward } from '../../monetization/ads';

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
  const [canSimulate, setCanSimulate] = useState(false);

  // Keep latest onComplete in a ref so useEffect doesn't depend on inline callback reference
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Track whether an ad run has already been triggered for the current open session
  const hasStartedRef = useRef(false);

  const startAd = async () => {
    setLoading(true);
    setError(null);
    setCanSimulate(false);

    const result = await showRewardedVideo();
    setLoading(false);

    if (result.watched) {
      onCompleteRef.current();
    } else {
      setError(
        result.error || 'پخش تبلیغ به اتمام نرسید. برای دریافت انرژی باید تبلیغ تا انتها دیده شود.'
      );
      if (result.canSimulate) {
        setCanSimulate(true);
      }
    }
  };

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    const res = await simulateAdReward();
    setLoading(false);
    if (res.watched) {
      onCompleteRef.current();
    }
  };

  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setCanSimulate(false);
      hasStartedRef.current = false;
      return;
    }

    // Only start ad ONCE per modal open transition
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let isMounted = true;

    async function runAd() {
      setLoading(true);
      setError(null);
      setCanSimulate(false);

      const result = await showRewardedVideo();
      if (!isMounted) return;

      setLoading(false);

      if (result.watched) {
        onCompleteRef.current();
      } else {
        setError(
          result.error || 'پخش تبلیغ به اتمام نرسید. برای دریافت انرژی باید تبلیغ تا انتها دیده شود.'
        );
        if (result.canSimulate) {
          setCanSimulate(true);
        }
      }
    }

    void runAd();

    return () => {
      isMounted = false;
    };
  }, [open]);

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

        <div className="mt-6 flex flex-col gap-2.5">
          <div className="flex gap-2.5">
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
                className="flex-1 rounded-xl border border-amber/50 py-2.5 text-xs text-amber transition active:opacity-70 disabled:opacity-40"
              >
                تلاش مجدد
              </button>
            )}
          </div>

          {canSimulate && (
            <button
              type="button"
              disabled={busy || loading}
              onClick={() => void handleSimulate()}
              className="w-full rounded-xl border border-amber/30 bg-amber/10 py-2.5 text-xs text-amber transition active:opacity-70 disabled:opacity-40"
            >
              دریافت +۵ انرژی (شبیه‌سازی حالت تست)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
