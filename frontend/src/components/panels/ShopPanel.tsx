import { useState } from 'react';
import type { GameState, ShopSku } from '../../types/game';
import { t } from '../../utils/i18n';

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

  const lang = state.language || 'fa';
  const isEn = lang === 'en';

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.deviceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(isEn ? 'Copy save code:' : 'کد ذخیره را کپی کن:', state.deviceId);
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
      <section className={`rounded-xl border border-amber/40 bg-panel px-4 py-3 ${isEn ? 'text-left' : 'text-right'}`}>
        <p className="text-sm text-amber">{t('saveCodeLabel', lang)}</p>
        <p className="mt-1 text-xs leading-6 text-ink-muted">
          {t('saveCodeDescription', lang)}
        </p>
        <p
          className="mt-3 break-all rounded-lg border border-line bg-oled px-3 py-2 font-mono text-xs text-ink text-left"
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
            {copied ? t('copied', lang) : t('copySaveCode', lang)}
          </button>
          <button
            type="button"
            onClick={() => setRestoreOpen((v) => !v)}
            className="flex-1 rounded-lg border border-line py-2 text-xs text-ink-dim"
          >
            {restoreOpen ? (isEn ? 'Close' : 'بستن') : t('restoreSaveCode', lang)}
          </button>
        </div>
        {restoreOpen && (
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            <p className="text-xs text-ink-muted">
              {t('restoreModalHint', lang)}
            </p>
            <input
              value={restoreCode}
              onChange={(e) => setRestoreCode(e.target.value)}
              placeholder={t('restoreInputPlaceholder', lang)}
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
              {restoring ? (isEn ? 'Loading...' : 'در حال بارگذاری...') : t('restoreButton', lang)}
            </button>
          </div>
        )}
      </section>

      <button
        type="button"
        disabled={busy}
        onClick={onWatchAd}
        className={`w-full rounded-xl border border-amber/50 bg-panel px-4 py-3 ${isEn ? 'text-left' : 'text-right'} transition hover:amber-glow disabled:opacity-40`}
      >
        <p className="text-sm text-amber">{t('watchAdButton', lang)}</p>
        <p className="mt-1 text-xs text-ink-muted">+5 {t('energy', lang)} (Adivery Network)</p>
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
            className={`w-full rounded-xl border border-line bg-panel px-4 py-3 ${isEn ? 'text-left' : 'text-right'} transition enabled:hover:border-amber/40 disabled:opacity-45`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink">{item.title}</p>
                <p className="mt-1 text-xs text-ink-muted">{item.description}</p>
              </div>
              <span className="shrink-0 text-xs text-amber">
                {owned
                  ? (isEn ? 'Purchased' : 'خریداری شده')
                  : (isEn ? `${item.priceTomans.toLocaleString('en-US')} Tomans` : `${item.priceTomans.toLocaleString('fa-IR')} تومان`)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
