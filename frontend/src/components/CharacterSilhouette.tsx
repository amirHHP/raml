import {
  EQUIP_SLOTS,
  EQUIP_SLOT_LABELS,
  type ClassType,
  type InventoryItem,
  type EquipSlot,
} from '../types/game';
import { getEquippedBySlot } from '../utils/equipment';
import { toFaDigits } from '../utils/formatCountdown';

const SLOT_ICONS: Record<EquipSlot, string> = {
  weapon: '⚔️',
  head: '🪖',
  chest: '🛡️',
  hands: '🥊',
  legs: '👖',
  feet: '🥾',
  accessory: '📿',
};

/** Stone when the slot is empty, gilded when something is worn there. */
function gear(worn: boolean, activeColor = '#c9a227') {
  return worn
    ? {
        fill: 'url(#gearWorn)',
        stroke: activeColor,
        strokeWidth: 1.2,
        strokeOpacity: 0.9,
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
  classType = 'warrior',
}: {
  inventory: InventoryItem[];
  classType?: ClassType;
}) {
  const equipped = getEquippedBySlot(inventory);
  const wornCount = Object.keys(equipped).length;
  const hasWeapon = Boolean(equipped.weapon);

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-[220px]">
        <svg viewBox="0 0 130 200" className="h-auto w-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]" aria-hidden>
          <defs>
            <linearGradient id="gearWorn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#85631b" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#251d0e" stopOpacity="0.85" />
            </linearGradient>

            {/* Class Aura Gradients */}
            <radialGradient id="haloWarrior" cx="50%" cy="42%" r="52%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
              <stop offset="60%" stopColor="#78350f" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="haloMage" cx="50%" cy="42%" r="52%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#0369a1" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="haloRogue" cx="50%" cy="42%" r="52%">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#047857" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="haloRanger" cx="50%" cy="42%" r="52%">
              <stop offset="0%" stopColor="#65a30d" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#4d7c0f" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>

            {/* Weapon Glow Filters */}
            <filter id="weaponGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Class Ember Halo */}
          {classType === 'warrior' && <ellipse cx="62" cy="92" rx="56" ry="82" fill="url(#haloWarrior)" />}
          {classType === 'mage' && <ellipse cx="62" cy="92" rx="56" ry="82" fill="url(#haloMage)" />}
          {classType === 'rogue' && <ellipse cx="62" cy="92" rx="56" ry="82" fill="url(#haloRogue)" />}
          {classType === 'ranger' && <ellipse cx="62" cy="92" rx="56" ry="82" fill="url(#haloRanger)" />}

          {/* ========================================================
              WARRIOR SILHOUETTE (جنگجو)
             ======================================================== */}
          {classType === 'warrior' && (
            <g id="warrior-silhouette">
              {/* Cape */}
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
              <path d="M50 170 L59 170 L61 182 L47 182 Z" {...gear(Boolean(equipped.feet))} />
              <path d="M65 170 L74 170 L77 182 L63 182 Z" {...gear(Boolean(equipped.feet))} />
              {/* Tassets */}
              <path d="M48 100 L76 100 L74 120 L50 120 Z" {...gear(Boolean(equipped.legs))} />
              {/* Arms */}
              <path d="M39 60 C31 74, 29 92, 32 106 L41 106 C38 90, 40 74, 47 62 Z" fill="#0a0908" stroke="#2f2b23" strokeWidth="0.75" />
              <path d="M85 60 C93 74, 95 92, 92 106 L83 106 C86 90, 84 74, 77 62 Z" fill="#0a0908" stroke="#2f2b23" strokeWidth="0.75" />
              {/* Cuirass */}
              <path d="M49 52 L75 52 L78 90 C72 98, 52 98, 46 90 Z" {...gear(Boolean(equipped.chest))} />
              {equipped.chest && <path d="M62 54 V94 M53 64 H71" stroke="#c9a227" strokeWidth="0.6" opacity="0.4" fill="none" />}
              {/* Belt */}
              <path d="M47 91 L77 91 L76 100 L48 100 Z" fill="#100e0b" stroke="#332e25" strokeWidth="0.75" />
              {/* Pauldrons */}
              <path d="M35 61 C36 50, 47 48, 51 54 L48 65 C43 68, 37 66, 35 61 Z" {...gear(Boolean(equipped.chest))} />
              <path d="M89 61 C88 50, 77 48, 73 54 L76 65 C81 68, 87 66, 89 61 Z" {...gear(Boolean(equipped.chest))} />
              {/* Gauntlets */}
              <path d="M31 104 L41 104 L40 114 Q35 117, 32 113 Z" {...gear(Boolean(equipped.hands))} />
              <path d="M83 104 L93 104 L92 113 Q87 117, 84 114 Z" {...gear(Boolean(equipped.hands))} />
              {/* Gorget */}
              <path d="M56 43 L68 43 L69 52 L55 52 Z" fill="#0c0b09" stroke="#332e25" strokeWidth="0.75" />
              {/* Helm */}
              <path d="M51 21 Q62 8, 73 21 L74 37 Q62 48, 50 37 Z" {...gear(Boolean(equipped.head))} />
              <path d="M53 29 H71" stroke="#c9a227" strokeWidth="2" opacity="0.45" />
              <path d="M62 21 V37" stroke="#000" strokeWidth="1.25" opacity="0.55" />

              {/* HEAVY SWORD IN HAND */}
              {hasWeapon ? (
                <g id="warrior-heavy-sword" filter="url(#weaponGlow)">
                  {/* Glowing Blade Body */}
                  <path
                    d="M95 106 L102 106 L100 178 L97 178 Z"
                    fill="url(#gearWorn)"
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                  />
                  {/* Inner Steel Fuller */}
                  <line x1="98.5" y1="108" x2="98.5" y2="174" stroke="#fef3c7" strokeWidth="0.7" opacity="0.9" />
                  {/* Ornate Crossguard */}
                  <path d="M90 105 L107 105 L105 111 L92 111 Z" fill="#b45309" stroke="#f59e0b" strokeWidth="0.9" />
                  {/* Leather Wrapped Grip in Hand */}
                  <path d="M96 93 L101 93 L101 105 L96 105 Z" fill="#451a03" stroke="#d97706" strokeWidth="0.7" />
                  {/* Golden Runic Pommel */}
                  <circle cx="98.5" cy="90" r="3.2" fill="#f59e0b" stroke="#fef3c7" strokeWidth="0.8" />
                  {/* Ember Spark Effects */}
                  <circle cx="102" cy="120" r="1" fill="#fbbf24" opacity="0.8" />
                  <circle cx="96" cy="145" r="0.8" fill="#f59e0b" />
                  <circle cx="100" cy="165" r="1.1" fill="#fef3c7" />
                </g>
              ) : (
                <g stroke="#3a3428" strokeOpacity="0.6" fill="#100e0b">
                  <path d="M97 112 L100 112 L99 175 Z" strokeWidth="0.6" />
                  <path d="M93 107 L104 107 L104 110 L93 110 Z" strokeWidth="0.6" />
                </g>
              )}
            </g>
          )}

          {/* ========================================================
              MAGE SILHOUETTE (جادوگر)
             ======================================================== */}
          {classType === 'mage' && (
            <g id="mage-silhouette">
              {/* Flowing Outer Wizard Robes */}
              <path
                d="M42 54 Q20 110, 26 172 L98 172 Q104 110, 82 54 Z"
                fill="#0a0f18"
                stroke="#1e3a8a"
                strokeWidth="0.85"
              />
              {/* Inner Robe Layer */}
              <path
                d="M50 56 L74 56 L78 168 L46 168 Z"
                {...gear(Boolean(equipped.chest), '#38bdf8')}
              />
              {/* Wide Robe Sleeves */}
              <path d="M38 58 Q22 80, 20 115 L32 112 Q36 85, 46 62 Z" fill="#0c1424" stroke="#1d4ed8" strokeWidth="0.75" />
              <path d="M86 58 Q102 80, 104 115 L92 112 Q88 85, 78 62 Z" fill="#0c1424" stroke="#1d4ed8" strokeWidth="0.75" />

              {/* Shoes underneath */}
              <path d="M50 168 L58 168 L57 180 L48 180 Z" {...gear(Boolean(equipped.feet), '#38bdf8')} />
              <path d="M66 168 L74 168 L75 180 L66 180 Z" {...gear(Boolean(equipped.feet), '#38bdf8')} />

              {/* Pointed Sorcerer Hood & Head */}
              <path
                d="M62 8 L76 25 Q70 42, 62 45 Q54 42, 48 25 Z"
                {...gear(Boolean(equipped.head), '#38bdf8')}
              />
              {/* Glowing Rune on Hood */}
              <circle cx="62" cy="28" r="2.5" fill="#38bdf8" opacity="0.85" />
              <path d="M62 23 V33 M57 28 H67" stroke="#38bdf8" strokeWidth="0.6" opacity="0.7" />

              {/* CRYSTAL STAFF IN HAND */}
              <g id="wizard-staff" filter={hasWeapon ? 'url(#weaponGlow)' : undefined}>
                {/* Staff Pole */}
                <line x1="98" y1="35" x2="98" y2="182" stroke="#382414" strokeWidth="2.8" />
                <line x1="98" y1="35" x2="98" y2="182" stroke={hasWeapon ? '#38bdf8' : '#1e3a8a'} strokeWidth="1" opacity="0.9" />
                {/* Ornate Staff Headholder */}
                <path d="M93 36 L103 36 L98 46 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" />
                {/* Floating Arcane Orb Crystal at Top */}
                <circle cx="98" cy="24" r="7" fill={hasWeapon ? '#0284c7' : '#0f172a'} stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="98" cy="24" r="4" fill={hasWeapon ? '#7dd3fc' : '#334155'} />
                {/* Rotating Arcane Energy Rings */}
                <ellipse cx="98" cy="24" rx="10" ry="3.5" fill="none" stroke="#38bdf8" strokeWidth="0.8" opacity="0.9" transform="rotate(-25 98 24)" />
                <ellipse cx="98" cy="24" rx="3.5" ry="10" fill="none" stroke="#7dd3fc" strokeWidth="0.6" opacity="0.7" transform="rotate(35 98 24)" />
              </g>
            </g>
          )}

          {/* ========================================================
              ROGUE SILHOUETTE (راهزن)
             ======================================================== */}
          {classType === 'rogue' && (
            <g id="rogue-silhouette">
              {/* Shadow Fog at base */}
              <ellipse cx="62" cy="178" rx="42" ry="12" fill="#059669" opacity="0.18" />

              {/* Cloak / Scarf */}
              <path
                d="M46 48 Q28 85, 32 155 L62 145 L92 155 Q96 85, 78 48 Z"
                fill="#06120e"
                stroke="#065f46"
                strokeWidth="0.75"
              />

              {/* Sleek Trousers & Boots */}
              <path d="M52 110 L59 110 L58 174 L51 174 Z" {...gear(Boolean(equipped.legs), '#34d399')} />
              <path d="M65 110 L72 110 L73 174 L66 174 Z" {...gear(Boolean(equipped.legs), '#34d399')} />
              <path d="M49 174 L59 174 L60 182 L47 182 Z" {...gear(Boolean(equipped.feet), '#34d399')} />
              <path d="M65 174 L75 174 L77 182 L64 182 Z" {...gear(Boolean(equipped.feet), '#34d399')} />

              {/* Form-fitting Chestpiece */}
              <path
                d="M48 50 L76 50 L74 95 C68 100, 56 100, 50 95 Z"
                {...gear(Boolean(equipped.chest), '#34d399')}
              />
              {/* Cross Belts */}
              <line x1="50" y1="54" x2="74" y2="92" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />
              <line x1="74" y1="54" x2="50" y2="92" stroke="#10b981" strokeWidth="0.8" opacity="0.6" />

              {/* Assassin Hood & Eyes */}
              <path
                d="M48 24 Q62 10, 76 24 L74 42 Q62 48, 50 42 Z"
                {...gear(Boolean(equipped.head), '#34d399')}
              />
              {/* Glowing Eyes */}
              <circle cx="56" cy="30" r="1.5" fill="#34d399" />
              <circle cx="68" cy="30" r="1.5" fill="#34d399" />

              {/* DUAL SHADOW DAGGERS IN HANDS */}
              <g id="dual-daggers" filter={hasWeapon ? 'url(#weaponGlow)' : undefined}>
                {/* Left Dagger */}
                <path
                  d="M27 90 L32 90 L30 138 L25 132 Z"
                  fill={hasWeapon ? 'url(#gearWorn)' : '#064e3b'}
                  stroke="#34d399"
                  strokeWidth="1"
                />
                <line x1="24" y1="90" x2="35" y2="90" stroke="#34d399" strokeWidth="1.2" />
                <line x1="28.5" y1="92" x2="28.5" y2="134" stroke="#6ee7b7" strokeWidth="0.6" />

                {/* Right Dagger */}
                <path
                  d="M93 90 L98 90 L100 138 L95 132 Z"
                  fill={hasWeapon ? 'url(#gearWorn)' : '#064e3b'}
                  stroke="#34d399"
                  strokeWidth="1"
                />
                <line x1="90" y1="90" x2="101" y2="90" stroke="#34d399" strokeWidth="1.2" />
                <line x1="96.5" y1="92" x2="96.5" y2="134" stroke="#6ee7b7" strokeWidth="0.6" />
              </g>
            </g>
          )}

          {/* ========================================================
              RANGER SILHOUETTE (شکارچی)
             ======================================================== */}
          {classType === 'ranger' && (
            <g id="ranger-silhouette">
              {/* Quiver of Arrows on Back */}
              <g id="quiver" transform="translate(10, 0)">
                <rect x="74" y="42" width="8" height="42" rx="2" fill="#2d1c0b" stroke="#a3e635" strokeWidth="0.8" />
                {/* Arrow Feathers */}
                <line x1="75" y1="30" x2="75" y2="42" stroke="#a3e635" strokeWidth="1.2" />
                <line x1="78" y1="26" x2="78" y2="42" stroke="#bef264" strokeWidth="1.2" />
                <line x1="81" y1="32" x2="81" y2="42" stroke="#a3e635" strokeWidth="1.2" />
              </g>

              {/* Leggings & Boots */}
              <path d="M51 112 L58 112 L57 172 L51 172 Z" {...gear(Boolean(equipped.legs), '#a3e635')} />
              <path d="M66 112 L73 112 L72 172 L66 172 Z" {...gear(Boolean(equipped.legs), '#a3e635')} />
              <path d="M49 172 L58 172 L60 182 L47 182 Z" {...gear(Boolean(equipped.feet), '#a3e635')} />
              <path d="M65 172 L74 172 L76 182 L64 182 Z" {...gear(Boolean(equipped.feet), '#a3e635')} />

              {/* Tunic / Vest */}
              <path
                d="M48 50 L76 50 L74 100 C68 108, 56 108, 50 100 Z"
                {...gear(Boolean(equipped.chest), '#a3e635')}
              />

              {/* Hunter Hood & Feather */}
              <path
                d="M49 22 Q62 12, 75 22 L74 42 Q62 46, 50 42 Z"
                {...gear(Boolean(equipped.head), '#a3e635')}
              />
              {/* Feather Accent */}
              <path d="M74 20 Q82 12, 85 8 Q80 18, 74 24 Z" fill="#a3e635" opacity="0.9" />

              {/* FALCON LONGBOW IN HAND */}
              <g id="longbow" filter={hasWeapon ? 'url(#weaponGlow)' : undefined}>
                {/* Curved Bow Wood */}
                <path d="M25 32 Q13 100, 25 168" fill="none" stroke="#543818" strokeWidth="3" />
                <path d="M25 32 Q13 100, 25 168" fill="none" stroke={hasWeapon ? '#a3e635' : '#365314'} strokeWidth="1" opacity="0.9" />
                {/* Falcon Carved Wing Tips */}
                <path d="M25 32 L20 27 L26 35 Z" fill="#a3e635" />
                <path d="M25 168 L20 173 L26 165 Z" fill="#a3e635" />
                {/* Taut Bowstring */}
                <line x1="25" y1="33" x2="25" y2="167" stroke="#fef08a" strokeWidth="0.8" opacity="0.9" />
                {/* Notched Arrow in Hand */}
                {hasWeapon && (
                  <g id="notched-arrow">
                    <line x1="25" y1="100" x2="52" y2="100" stroke="#bef264" strokeWidth="1.2" />
                    <polygon points="25,98 20,100 25,102" fill="#ecfccb" />
                  </g>
                )}
              </g>
            </g>
          )}

          {/* ========================================================
              COMMON ACCESSORIES (Amulet & Ground)
             ======================================================== */}
          {/* Amulet chain across chest */}
          {equipped.accessory && (
            <g id="equipped-accessory">
              <path
                d="M52 53 Q62 68, 72 53"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.4"
                opacity="0.9"
              />
              <path d="M62 65 L66 70 L62 75 L58 70 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.6" />
              <circle cx="62" cy="70" r="1.5" fill="#ffffff" />
            </g>
          )}

          {/* Ground pedestal */}
          <ellipse cx="62" cy="186" rx="34" ry="4.5" fill="#100e0a" />
          <ellipse
            cx="62"
            cy="186"
            rx="34"
            ry="4.5"
            fill="none"
            stroke={
              classType === 'warrior'
                ? '#f59e0b'
                : classType === 'mage'
                  ? '#38bdf8'
                  : classType === 'rogue'
                    ? '#34d399'
                    : '#a3e635'
            }
            strokeWidth="0.8"
            opacity="0.4"
          />
        </svg>
      </div>

      {/* Gamified Equipment Slots Grid */}
      <div className="mt-5 border-t border-bone/10 pt-4">
        <h4 className="mb-2.5 text-[11px] font-medium tracking-wider text-bone-dim">
          پوشیدنی‌ها و تجهیزات فعال ({toFaDigits(wornCount)}/۷)
        </h4>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {EQUIP_SLOTS.map((slot) => {
            const item = equipped[slot];
            const icon = SLOT_ICONS[slot];
            return (
              <div
                key={slot}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                  item
                    ? 'border-amber/40 bg-amber/10 text-amber shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                    : 'border-bone/10 bg-oled/60 text-bone-muted'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-sm">{item?.icon || icon}</span>
                  <span className="font-medium">{EQUIP_SLOT_LABELS[slot]}:</span>
                  <span className={`truncate ${item ? 'text-bone font-semibold' : 'text-bone-muted opacity-70'}`}>
                    {item ? item.name : 'تهی'}
                  </span>
                </div>
                {item && (
                  <span className="shrink-0 rounded bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold text-amber">
                    تجهیزشده
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
