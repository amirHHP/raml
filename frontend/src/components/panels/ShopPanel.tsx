import { useState } from 'react';
import type { GameState, ShopSku } from '../../types/game';

export function ShopPanel({
  items,
  state,
  busy,
  onBuy,
  onWatchAd,
  onRestore,
}: {
  items: ShopSku[];
  state: GameState;
  busy: boolean;
  onBuy: (sku: string) => void;
  onWatchAd: () => void;
  onRestore: (saveCode: string) => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoring, setRestoring] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.deviceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select via prompt for older WebViews
      window.prompt('کد ذخیره را کپی کن:', state.deviceId);
    }
  };

  const handleRestore = async () => {
    const code = restoreCode.trim();
    if (code.length < 8 || restoring || busy) return;
    setRestoring(true);
    try {
      const ok = await onRestore(code);
      if (ok) {
        setRestoreCode('');
        setRestoreOpen(false);
      }
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-3 px-4 py-4 pb-8">
      <section className="rounded-xl border border-amber/40 bg-panel px-4 py-3 text-right">
        <p className="text-sm text-amber">کد ذخیره</p>
        <p className="mt-1 text-xs leading-6 text-ink-muted">
          پیشرفت بازی روی این کد ذخیره می‌شود. آن را جایی امن نگه دار — اگر داده‌ها پاک
          شوند، با همین کد می‌توانی دوباره وارد شوی.
        </p>
        <p
          className="mt-3 break-all rounded-lg border border-line bg-oled px-3 py-2 font-mono text-xs text-ink"
          dir="ltr"
        >
          {state.deviceId}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => void copyCode()}
            className="flex-1 rounded-lg border border-amber/50 py-2 text-xs text-amber"
          >
            {copied ? 'کپی شد' : 'کپی کد'}
          </button>
          <button
            type="button"
            onClick={() => setRestoreOpen((v) => !v)}
            className="flex-1 rounded-lg border border-line py-2 text-xs text-ink-dim"
          >
            {restoreOpen ? 'بستن' : 'ورود با کد'}
          </button>
        </div>
        {restoreOpen && (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <p className="text-xs text-ink-muted">
              کد ذخیره‌ای که قبلاً کپی کرده‌ای را وارد کن تا همان بازی لود شود.
            </p>
            <input
              value={restoreCode}
              onChange={(e) => setRestoreCode(e.target.value)}
              placeholder="کد ذخیره"
              disabled={busy || restoring}
              dir="ltr"
              className="w-full rounded-lg border border-line bg-oled px-3 py-2 text-left font-mono text-xs text-ink outline-none focus:border-amber/50"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="button"
              disabled={busy || restoring || restoreCode.trim().length < 8}
              onClick={() => void handleRestore()}
              className="w-full rounded-lg border border-amber/50 py-2 text-xs text-amber disabled:opacity-40"
            >
              {restoring ? 'در حال بارگذاری...' : 'بارگذاری بازی'}
            </button>
          </div>
        )}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={onWatchAd}
        className="w-full rounded-xl border border-amber/50 bg-panel px-4 py-3 text-right transition hover:amber-glow disabled:opacity-40"
      >
        <p className="text-sm text-amber">تماشای تبلیغ ویدیویی</p>
        <p className="mt-1 text-xs text-ink-muted">+۵ انرژی (ماک تپسل/یکتانت)</p>
      </button>

      {items.map((item) => {
        const owned =
          item.type === 'non_consumable' && state.purchasedSkus.includes(item.sku);
        return (
          <button
            key={item.sku}
            type="button"
            disabled={busy || owned}
            onClick={() => onBuy(item.sku)}
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-right transition enabled:hover:border-amber/40 disabled:opacity-45"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{item.description}</p>
              </div>
              <span className="shrink-0 text-xs text-amber">
                {owned ? 'خریداری شده' : `${item.priceTomans.toLocaleString('fa-IR')} تومان`}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
