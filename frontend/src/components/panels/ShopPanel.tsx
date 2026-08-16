import { useState } from 'react';
import type { GameState, ShopSku } from '../../types/game';
import { t } from '../../utils/i18n';
import { ReferralPanel } from './ReferralPanel';

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
      {/* Save Code Backup & Restore */}
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
            className="flex-1 rounded-lg border border-amber/50 py-2 text-xs text-amber transition hover:bg-amber/10"
          >
            {copied ? t('copied', lang) : t('copySaveCode', lang)}
          </button>
          <button
            type="button"
            onClick={() => setRestoreOpen((v) => !v)}
            className="flex-1 rounded-lg border border-line py-2 text-xs text-ink-dim hover:text-ink transition"
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

      {/* Referral System */}
      <ReferralPanel language={lang} referralCode={state.referralCode || ''} />

      {/* Rewarded Ad Option */}
      <button
        type="button"
        disabled={busy}
        onClick={onWatchAd}
        className={`w-full rounded-xl border border-amber/50 bg-panel px-4 py-3 ${isEn ? 'text-left' : 'text-right'} transition hover:amber-glow disabled:opacity-40`}
      >
        <p className="text-sm text-amber">{t('watchAdButton', lang)}</p>
        <p className="mt-1 text-xs text-ink-muted">+5 {t('energy', lang)} (Adivery Network)</p>
      </button>

      {/* ZarinPal Gateway Header */}
      <div className={`flex items-center justify-between gap-2 px-1 pt-1 text-[11px] text-ink-muted ${isEn ? 'flex-row' : 'flex-row-reverse'}`}>
        <span>{t('paymentGateway', lang)}</span>
        <span className="font-mono text-[10px] text-amber/80">ZarinPal v4</span>
      </div>

      {/* Shop Packages */}
      {items.map((item) => {
        const owned =
          item.type === 'non_consumable' && state.purchasedSkus.includes(item.sku);
        const title = isEn && item.titleEn ? item.titleEn : item.title;
        const description = isEn && item.descriptionEn ? item.descriptionEn : item.description;
        const badge = isEn && item.badgeEn ? item.badgeEn : item.badge;

        return (
          <button
            key={item.sku}
            type="button"
            disabled={busy || owned}
            onClick={() => onBuy(item.sku)}
            className={`w-full rounded-xl border border-line bg-panel p-4 ${isEn ? 'text-left' : 'text-right'} transition enabled:hover:border-amber/60 enabled:hover:bg-sand-2/40 disabled:opacity-45 relative overflow-hidden`}
          >
            {badge && (
              <span className={`absolute top-0 ${isEn ? 'right-0 rounded-bl-lg' : 'left-0 rounded-br-lg'} bg-amber/20 border-b border-amber/40 px-2 py-0.5 text-[10px] font-semibold text-amber`}>
                {badge}
              </span>
            )}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 pr-1">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-muted leading-5">{description}</p>
                {item.rewardType === 'gold' && item.rewardValue && (
                  <p className="text-[11px] text-amber font-mono">
                    +{Number(item.rewardValue).toLocaleString(isEn ? 'en-US' : 'fa-IR')} {isEn ? 'Gold Coins' : 'سکه طلا'}
                  </p>
                )}
              </div>
              <div className="shrink-0 text-left">
                <span className="inline-block font-mono text-xs font-bold text-amber">
                  {owned
                    ? (isEn ? 'Purchased' : 'خریداری شده')
                    : (isEn ? `${item.priceTomans.toLocaleString('en-US')} Tomans` : `${item.priceTomans.toLocaleString('fa-IR')} تومان`)}
                </span>
                {!owned && (
                  <p className="mt-1 text-[10px] text-ink-muted text-center">
                    {t('buyButton', lang)}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
