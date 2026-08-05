import {
  EQUIP_SLOT_LABELS,
  type InventoryItem,
} from '../../types/game';

export function InventoryPanel({ items }: { items: InventoryItem[] }) {
  if (!items.length) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-2xl mb-2">🎒</p>
        <p className="text-sm text-ink-muted">
          کوله‌پشتی خالی است. هنوز آیتمی در طول بازی جمع‌آوری نکرده‌اید.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3 px-4 py-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-amber/30 bg-panel px-4 py-3.5 space-y-1.5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎒</span>
              <h3 className="font-semibold text-sm text-ink">{item.name}</h3>
            </div>
            <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-bold text-amber">
              ×{item.quantity}
            </span>
          </div>
          
          {item.description ? (
            <p className="text-xs leading-6 text-ink-muted pt-0.5">{item.description}</p>
          ) : null}
          
          {item.effect ? (
            <div className="flex items-start gap-1.5 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 mt-1">
              <span className="shrink-0 font-bold">✨ کاربرد:</span>
              <span className="leading-5">{item.effect}</span>
            </div>
          ) : null}

          {item.equipSlot ? (
            <p className="text-[11px] text-amber/80 font-medium pt-1">
              🛡️ پوشیدنی — {EQUIP_SLOT_LABELS[item.equipSlot]}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
