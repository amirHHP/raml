import type { GameState, ShopSku } from '../../types/game';

export function ShopPanel({
  items,
  state,
  busy,
  onBuy,
  onWatchAd,
}: {
  items: ShopSku[];
  state: GameState;
  busy: boolean;
  onBuy: (sku: string) => void;
  onWatchAd: () => void;
}) {
  return (
    <div className="space-y-3 px-4 py-4 pb-8">
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
