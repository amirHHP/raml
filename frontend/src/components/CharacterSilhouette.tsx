import {
  EQUIP_SLOT_LABELS,
  type EquipSlot,
  type InventoryItem,
} from '../types/game';
import { getEquippedBySlot } from '../utils/equipment';

/** CSS % positions for slot markers on the silhouette figure. */
const SLOT_LAYOUT: Record<
  EquipSlot,
  { top: string; left: string; side?: 'left' | 'right' | 'center' }
> = {
  head: { top: '6%', left: '50%', side: 'center' },
  accessory: { top: '18%', left: '50%', side: 'center' },
  chest: { top: '32%', left: '50%', side: 'center' },
  hands: { top: '38%', left: '18%', side: 'left' },
  weapon: { top: '42%', left: '82%', side: 'right' },
  legs: { top: '62%', left: '50%', side: 'center' },
  feet: { top: '88%', left: '50%', side: 'center' },
};

const SLOT_ORDER: EquipSlot[] = [
  'head',
  'accessory',
  'chest',
  'hands',
  'weapon',
  'legs',
  'feet',
];

export function CharacterSilhouette({
  inventory,
}: {
  inventory: InventoryItem[];
}) {
  const equipped = getEquippedBySlot(inventory);
  const wornCount = Object.keys(equipped).length;

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <div className="relative aspect-[3/5] w-full">
        {/* Dark human figure */}
        <svg
          viewBox="0 0 120 200"
          className="h-full w-full"
          aria-hidden
          role="img"
        >
          <defs>
            <linearGradient id="bodyShade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#141414" />
              <stop offset="55%" stopColor="#0a0a0a" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            <radialGradient id="bodyGlow" cx="50%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#27272a" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Soft ground shadow */}
          <ellipse cx="60" cy="192" rx="28" ry="5" fill="#18181b" opacity="0.9" />

          {/* Head */}
          <ellipse cx="60" cy="28" rx="16" ry="18" fill="url(#bodyShade)" />
          <ellipse cx="60" cy="28" rx="16" ry="18" fill="url(#bodyGlow)" />

          {/* Neck */}
          <rect x="54" y="42" width="12" height="10" rx="2" fill="#0c0c0c" />

          {/* Torso */}
          <path
            d="M38 52 C38 48, 82 48, 82 52 L88 108 C88 118, 78 122, 60 122 C42 122, 32 118, 32 108 Z"
            fill="url(#bodyShade)"
          />
          <path
            d="M38 52 C38 48, 82 48, 82 52 L88 108 C88 118, 78 122, 60 122 C42 122, 32 118, 32 108 Z"
            fill="url(#bodyGlow)"
          />

          {/* Arms */}
          <path
            d="M38 56 C28 62, 20 78, 18 98 C17 108, 22 112, 28 108 L40 78"
            fill="#0a0a0a"
          />
          <path
            d="M82 56 C92 62, 100 78, 102 98 C103 108, 98 112, 92 108 L80 78"
            fill="#0a0a0a"
          />

          {/* Legs */}
          <path
            d="M48 120 L42 178 C41 184, 46 188, 52 186 L56 122"
            fill="#0a0a0a"
          />
          <path
            d="M72 120 L78 178 C79 184, 74 188, 68 186 L64 122"
            fill="#0a0a0a"
          />

          {/* Subtle outline so the figure reads on OLED */}
          <path
            d="M60 10 C48 10, 44 22, 44 28 C44 36, 50 42, 54 44 L38 52 L32 108 L48 122 L42 178 L52 186 L56 122 L64 122 L68 186 L78 178 L72 122 L88 108 L82 52 L66 44 C70 42, 76 36, 76 28 C76 22, 72 10, 60 10Z"
            fill="none"
            stroke="#27272a"
            strokeWidth="1"
            opacity="0.85"
          />

          {/* Equipped overlays: faint amber accents on filled regions */}
          {equipped.head && (
            <ellipse
              cx="60"
              cy="26"
              rx="17"
              ry="19"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.25"
              opacity="0.55"
            />
          )}
          {equipped.accessory && (
            <path
              d="M52 44 Q60 50 68 44"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.7"
            />
          )}
          {equipped.chest && (
            <path
              d="M44 58 L76 58 L80 105 L40 105 Z"
              fill="#f59e0b"
              opacity="0.08"
            />
          )}
          {equipped.hands && (
            <>
              <circle cx="20" cy="100" r="6" fill="#f59e0b" opacity="0.2" />
              <circle cx="100" cy="100" r="6" fill="#f59e0b" opacity="0.2" />
            </>
          )}
          {equipped.weapon && (
            <path
              d="M98 70 L108 50 M103 58 L112 62"
              stroke="#f59e0b"
              strokeWidth="1.75"
              opacity="0.75"
              strokeLinecap="round"
            />
          )}
          {equipped.legs && (
            <path
              d="M46 130 L54 170 M74 130 L66 170"
              stroke="#f59e0b"
              strokeWidth="3"
              opacity="0.12"
              strokeLinecap="round"
            />
          )}
          {equipped.feet && (
            <>
              <ellipse cx="48" cy="186" rx="8" ry="3.5" fill="#f59e0b" opacity="0.25" />
              <ellipse cx="72" cy="186" rx="8" ry="3.5" fill="#f59e0b" opacity="0.25" />
            </>
          )}
        </svg>

        {/* Slot markers */}
        {SLOT_ORDER.map((slot) => {
          const layout = SLOT_LAYOUT[slot];
          const item = equipped[slot];
          const filled = Boolean(item);
          return (
            <div
              key={slot}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: layout.top, left: layout.left }}
              title={
                item
                  ? `${EQUIP_SLOT_LABELS[slot]}: ${item.name}`
                  : EQUIP_SLOT_LABELS[slot]
              }
            >
              <span
                className={[
                  'block h-2.5 w-2.5 rounded-full border transition duration-300',
                  filled
                    ? 'border-amber bg-amber/80 shadow-[0_0_10px_rgba(245,158,11,0.55)] scale-110'
                    : 'border-line bg-oled/80',
                ].join(' ')}
                aria-label={
                  item
                    ? `${EQUIP_SLOT_LABELS[slot]}: ${item.name}`
                    : `${EQUIP_SLOT_LABELS[slot]} خالی`
                }
              />
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[11px] text-ink-muted">
        {wornCount > 0
          ? `${wornCount} پوشیدنی روی پیکر`
          : 'هنوز پوشیدنی‌ای پیدا نکرده‌ای'}
      </p>
    </div>
  );
}
