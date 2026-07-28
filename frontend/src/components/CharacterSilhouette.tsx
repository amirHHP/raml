import {
  EQUIP_SLOTS,
  EQUIP_SLOT_LABELS,
  type InventoryItem,
} from '../types/game';
import { getEquippedBySlot } from '../utils/equipment';
import { toFaDigits } from '../utils/formatCountdown';

/** Stone when the slot is empty, gilded when something is worn there. */
function gear(worn: boolean) {
  return worn
    ? {
        fill: 'url(#gearWorn)',
        stroke: '#c9a227',
        strokeWidth: 0.9,
        strokeOpacity: 0.6,
      }
    : {
        fill: '#0d0c0a',
        stroke: '#3a3428',
        strokeWidth: 0.9,
        strokeOpacity: 0.9,
      };
}

export function CharacterSilhouette({
  inventory,
}: {
  inventory: InventoryItem[];
}) {
  const equipped = getEquippedBySlot(inventory);
  const wornCount = Object.keys(equipped).length;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[210px]">
        <svg viewBox="0 0 130 200" className="h-auto w-full" aria-hidden>
          <defs>
            <linearGradient id="gearWorn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d5720" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#20190d" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="emberHalo" cx="50%" cy="42%" r="52%">
              <stop offset="0%" stopColor="#8a7038" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
          </defs>

          <ellipse cx="62" cy="92" rx="56" ry="82" fill="url(#emberHalo)" />

          {/* Cape hanging behind the armour */}
          <path
            d="M45 54 C30 86, 29 128, 34 158 L62 148 L90 158 C95 128, 94 86, 79 54 Z"
            fill="#070706"
            stroke="#282419"
            strokeWidth="0.75"
          />

          {/* Greaves */}
          <path d="M51 118 L59 118 L58 170 L52 170 Z" {...gear(Boolean(equipped.legs))} />
          <path d="M65 118 L73 118 L72 170 L66 170 Z" {...gear(Boolean(equipped.legs))} />

          {/* Boots */}
          <path
            d="M50 170 L59 170 L61 182 L47 182 Z"
            {...gear(Boolean(equipped.feet))}
          />
          <path
            d="M65 170 L74 170 L77 182 L63 182 Z"
            {...gear(Boolean(equipped.feet))}
          />

          {/* Tassets over the hips */}
          <path
            d="M48 100 L76 100 L74 120 L50 120 Z"
            {...gear(Boolean(equipped.legs))}
          />

          {/* Arms */}
          <path
            d="M39 60 C31 74, 29 92, 32 106 L41 106 C38 90, 40 74, 47 62 Z"
            fill="#0a0908"
            stroke="#2f2b23"
            strokeWidth="0.75"
          />
          <path
            d="M85 60 C93 74, 95 92, 92 106 L83 106 C86 90, 84 74, 77 62 Z"
            fill="#0a0908"
            stroke="#2f2b23"
            strokeWidth="0.75"
          />

          {/* Cuirass */}
          <path
            d="M49 52 L75 52 L78 90 C72 98, 52 98, 46 90 Z"
            {...gear(Boolean(equipped.chest))}
          />
          {equipped.chest && (
            <path
              d="M62 54 V94 M53 64 H71"
              stroke="#c9a227"
              strokeWidth="0.6"
              opacity="0.4"
              fill="none"
            />
          )}

          {/* Belt */}
          <path d="M47 91 L77 91 L76 100 L48 100 Z" fill="#100e0b" stroke="#332e25" strokeWidth="0.75" />

          {/* Pauldrons */}
          <path
            d="M35 61 C36 50, 47 48, 51 54 L48 65 C43 68, 37 66, 35 61 Z"
            {...gear(Boolean(equipped.chest))}
          />
          <path
            d="M89 61 C88 50, 77 48, 73 54 L76 65 C81 68, 87 66, 89 61 Z"
            {...gear(Boolean(equipped.chest))}
          />

          {/* Gauntlets */}
          <path
            d="M31 104 L41 104 L40 114 Q35 117, 32 113 Z"
            {...gear(Boolean(equipped.hands))}
          />
          <path
            d="M83 104 L93 104 L92 113 Q87 117, 84 114 Z"
            {...gear(Boolean(equipped.hands))}
          />

          {/* Gorget */}
          <path d="M56 43 L68 43 L69 52 L55 52 Z" fill="#0c0b09" stroke="#332e25" strokeWidth="0.75" />

          {/* Helm with an ember-lit visor */}
          <path
            d="M51 21 Q62 8, 73 21 L74 37 Q62 48, 50 37 Z"
            {...gear(Boolean(equipped.head))}
          />
          <path d="M53 29 H71" stroke="#c9a227" strokeWidth="2" opacity="0.45" />
          <path d="M62 21 V37" stroke="#000" strokeWidth="1.25" opacity="0.55" />

          {/* Amulet chain across the chest */}
          {equipped.accessory && (
            <>
              <path
                d="M52 53 Q62 68, 72 53"
                fill="none"
                stroke="#c9a227"
                strokeWidth="1.1"
                opacity="0.8"
              />
              <path d="M62 66 L65 70 L62 74 L59 70 Z" fill="#c9a227" opacity="0.85" />
            </>
          )}

          {/* Sword held point-down at the knight's side */}
          {equipped.weapon && (
            <g stroke="#c9a227" strokeOpacity="0.8" fill="#c9a227" fillOpacity="0.22">
              <path d="M96 112 L101 112 L99 178 L98 178 Z" strokeWidth="0.7" />
              <path d="M92 106 L105 106 L105 111 L92 111 Z" strokeWidth="0.7" />
              <path d="M96 94 L100 94 L100 106 L96 106 Z" strokeWidth="0.7" />
              <circle cx="98" cy="91" r="2.4" strokeWidth="0.7" />
            </g>
          )}

          {/* Ground */}
          <ellipse cx="62" cy="186" rx="32" ry="4.5" fill="#100e0a" />
          <ellipse
            cx="62"
            cy="186"
            rx="32"
            ry="4.5"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.6"
            opacity="0.2"
          />
        </svg>
      </div>

      <dl className="mt-5 border-t border-bone/10 pt-4">
        {EQUIP_SLOTS.map((slot) => {
          const item = equipped[slot];
          return (
            <div
              key={slot}
              className="flex items-baseline gap-2 border-b border-bone/5 py-2 text-xs last:border-0"
            >
              <dt className="shrink-0 text-bone-dim">{EQUIP_SLOT_LABELS[slot]}</dt>
              <span className="souls-leader" aria-hidden />
              <dd className={item ? 'truncate text-gold' : 'text-bone-muted'}>
                {item ? item.name : 'تهی'}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-4 text-center text-[10px] tracking-widest text-bone-muted">
        {wornCount > 0
          ? `${toFaDigits(wornCount)} پوشیدنی بر پیکر`
          : 'پیکری بی‌جامه در تاریکی'}
      </p>
    </div>
  );
}
