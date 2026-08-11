import { useEffect, useState } from 'react';
import type { InventoryItem, Language } from '../types/game';
import { t, type TranslationKey } from '../utils/i18n';

export type PopupData =
  | { kind: 'unlock'; feature: string }
  | { kind: 'item'; item: InventoryItem };

const UNLOCK_META: Record<string, { icon: string; titleKey: TranslationKey; descKey: TranslationKey }> = {
  hp: { icon: '❤️', titleKey: 'popupUnlockHp', descKey: 'popupUnlockHpDesc' },
  mana: { icon: '🔮', titleKey: 'popupUnlockMana', descKey: 'popupUnlockManaDesc' },
  gold: { icon: '🪙', titleKey: 'popupUnlockGold', descKey: 'popupUnlockGoldDesc' },
  inventory: { icon: '🎒', titleKey: 'popupUnlockInventory', descKey: 'popupUnlockInventoryDesc' },
  stats: { icon: '📊', titleKey: 'popupUnlockStats', descKey: 'popupUnlockStatsDesc' },
  home: { icon: '🏠', titleKey: 'popupUnlockHome', descKey: 'popupUnlockHomeDesc' },
};

export function ItemPopup({
  popup,
  language = 'fa',
  onDismiss,
}: {
  popup: PopupData;
  language?: Language;
  onDismiss: () => void;
}) {
  const [exiting, setExiting] = useState(false);

  const handleDismiss = () => {
    setExiting(true);
    setTimeout(onDismiss, 300);
  };

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (popup.kind === 'unlock') {
    const meta = UNLOCK_META[popup.feature];
    if (!meta) return null;

    return (
      <div
        className={`popup-overlay ${exiting ? 'is-exiting' : ''}`}
        onClick={handleDismiss}
        role="dialog"
        aria-modal="true"
        aria-label={t(meta.titleKey, language)}
      >
        <div className="popup-card" onClick={(e) => e.stopPropagation()}>
          <span className="popup-unlock-icon" aria-hidden="true">
            {meta.icon}
          </span>
          <h2
            className="text-center font-display text-xl font-bold tracking-wide"
            style={{ color: 'var(--color-gold)' }}
          >
            {t(meta.titleKey, language)}
          </h2>
          <p
            className="mt-2 text-center text-sm leading-7"
            style={{ color: 'var(--color-bone-dim)' }}
          >
            {t(meta.descKey, language)}
          </p>
          <button type="button" className="popup-dismiss-btn" onClick={handleDismiss}>
            {t('popupDismiss', language)}
          </button>
        </div>
      </div>
    );
  }

  // kind === 'item'
  const { item } = popup;

  return (
    <div
      className={`popup-overlay ${exiting ? 'is-exiting' : ''}`}
      onClick={handleDismiss}
      role="dialog"
      aria-modal="true"
      aria-label={t('popupNewItem', language)}
    >
      <div className="popup-card" onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <h2
          className="text-center font-display text-lg font-bold tracking-wide"
          style={{ color: 'var(--color-gold)' }}
        >
          {t('popupNewItem', language)}
        </h2>

        {/* Item image or icon */}
        {item.imageUrl ? (
          <div className="popup-image-frame mt-4">
            <img src={item.imageUrl} alt={item.name} loading="eager" />
          </div>
        ) : (
          <span className="popup-unlock-icon mt-3">{item.icon || '🎒'}</span>
        )}

        {/* Item name */}
        <h3
          className="mt-2 text-center text-base font-semibold"
          style={{ color: 'var(--color-bone)' }}
        >
          {item.icon} {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p
            className="mt-1.5 text-center text-xs leading-6"
            style={{ color: 'var(--color-bone-dim)' }}
          >
            {item.description}
          </p>
        )}

        {/* Effect */}
        {item.effect && (
          <div
            className="mx-auto mt-3 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs"
            style={{
              borderColor: 'rgba(16, 185, 129, 0.3)',
              background: 'rgba(6, 78, 59, 0.3)',
              color: '#6ee7b7',
            }}
          >
            <span className="font-bold">✨</span>
            <span>{item.effect}</span>
          </div>
        )}

        {/* Added to inventory badge */}
        <p
          className="mt-3 text-center text-xs font-medium"
          style={{ color: 'var(--color-bone-muted)' }}
        >
          🎒 {t('popupItemAdded', language)}
        </p>

        <button type="button" className="popup-dismiss-btn" onClick={handleDismiss}>
          {t('popupDismiss', language)}
        </button>
      </div>
    </div>
  );
}
