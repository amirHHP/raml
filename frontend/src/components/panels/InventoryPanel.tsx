import {
  EQUIP_SLOT_LABELS,
  type InventoryItem,
  type Language,
} from '../../types/game';
import { getSlotLabel, t } from '../../utils/i18n';

export function InventoryPanel({
  items,
  language = 'fa',
  onToggleEquip,
}: {
  items: InventoryItem[];
  language?: Language;
  onToggleEquip?: (itemId: string) => void;
}) {
  const isEn = language === 'en';

  if (!items.length) {
    return (
      <div className="px-4 py-12 text-center">
        <p className="text-2xl mb-2">🎒</p>
        <p className="text-sm text-ink-muted">
          {t('inventoryEmpty', language)}
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3 px-4 py-4">
      {items.map((item) => (
        <li
          key={item.id}
          className={`rounded-xl border px-4 py-3.5 space-y-1.5 transition ${
            item.isEquipped
              ? 'border-amber/60 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
              : 'border-amber/30 bg-panel'
          }`}
        >
          {/* Item AI image (if available) */}
          {item.imageUrl && (
            <div className="mb-2 overflow-hidden rounded-lg border border-amber/20">
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 border-b border-line/40 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{item.icon || '🎒'}</span>
              <h3 className="font-semibold text-sm text-ink">{item.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {item.isEquipped && (
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/40">
                  🛡️ {t('equippedBadge', language)}
                </span>
              )}
              <span className="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-bold text-amber">
                ×{item.quantity}
              </span>
            </div>
          </div>

          {item.description ? (
            <p className="text-xs leading-6 text-ink-muted pt-0.5">{item.description}</p>
          ) : null}

          {item.effect ? (
            <div className="flex items-start gap-1.5 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 mt-1">
              <span className="shrink-0 font-bold">✨ {isEn ? 'Effect:' : 'کاربرد:'}</span>
              <span className="leading-5">{item.effect}</span>
            </div>
          ) : null}

          {item.equipSlot ? (
            <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line/30 pt-2">
              <span className="text-[11px] text-amber/80 font-medium">
                🛡️ {isEn ? 'Wearable' : 'پوشیدنی'} — {isEn ? getSlotLabel(item.equipSlot, language) : EQUIP_SLOT_LABELS[item.equipSlot]}
              </span>
              <button
                type="button"
                onClick={() => onToggleEquip?.(item.id)}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold transition shadow-sm cursor-pointer ${
                  item.isEquipped
                    ? 'border border-rose-500/40 bg-rose-950/50 text-rose-300 hover:bg-rose-900/70 active:scale-95'
                    : 'border border-amber-500/50 bg-amber-950/60 text-amber-300 hover:bg-amber-900/80 active:scale-95'
                }`}
              >
                {item.isEquipped ? `✖️ ${t('unequipButton', language)}` : `🛡️ ${t('equipButton', language)}`}
              </button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
