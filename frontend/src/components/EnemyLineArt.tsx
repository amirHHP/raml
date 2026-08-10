import type { EnemyLineArtType } from '../types/game';

/**
 * Renders dynamic AI character line art (`asciiArt`) or complex SVG line drawings
 * keyed by `enemy_line_art_type`.
 */
export function EnemyLineArt({
  type,
  asciiArt,
  className = '',
}: {
  type: EnemyLineArtType;
  asciiArt?: string | null;
  className?: string;
}) {
  const hasAscii = Boolean(asciiArt && asciiArt.trim());
  if (!hasAscii && (!type || type === 'none')) return null;

  return (
    <div className={`flex justify-center py-3 ${className}`} aria-hidden>
      {hasAscii ? (
        <div className="w-full max-w-sm overflow-x-auto rounded-xl border border-amber/30 bg-zinc-950/80 p-3.5 shadow-md shadow-amber/5 backdrop-blur-sm">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-amber/15 text-[10px] text-amber/60 font-mono tracking-wider">
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              تصویرگری AI (خطوط کاراکتر)
            </span>
            <span>Raml Line-Art</span>
          </div>
          <pre className="font-mono text-[12px] leading-[1.3] text-amber text-center whitespace-pre overflow-x-auto selection:bg-amber/20 select-none">
            {asciiArt?.trim()}
          </pre>
        </div>
      ) : (
        <div className="relative flex items-center justify-center rounded-xl border border-white/5 bg-zinc-950/40 p-2 shadow-inner">
          <svg
            width="150"
            height="120"
            viewBox="0 0 150 120"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-300/80 drop-shadow-[0_0_8px_rgba(245,158,11,0.25)]"
          >
            {type === 'orc_guardian' && <OrcGuardian />}
            {type === 'dragon' && <Dragon />}
            {type === 'skeleton' && <Skeleton />}
            {type === 'shadow' && <Shadow />}
            {type === 'desert_spirit' && <DesertSpirit />}
            {type === 'chest' && <Chest />}
            {type === 'castle' && <Castle />}
            {type === 'boss_demon' && <BossDemon />}
            {type === 'magic_portal' && <MagicPortal />}
          </svg>
        </div>
      )}
    </div>
  );
}

function OrcGuardian() {
  return (
    <g className="animate-fade-in">
      {/* Horned Helm & Face */}
      <path d="M50 42 L75 22 L100 42" strokeWidth="1.5" />
      <path d="M42 35 C40 20, 25 15, 20 22 C30 28, 45 35, 52 42" />
      <path d="M108 35 C110 20, 125 15, 130 22 C120 28, 105 35, 98 42" />
      <path d="M52 42 H98 V70 C98 85, 75 95, 75 95 C75 95, 52 85, 52 70 Z" strokeWidth="1.4" />
      {/* Eyes & Brow */}
      <path d="M60 52 L68 55 L60 58 M90 52 L82 55 L90 58" strokeWidth="1.3" />
      <circle cx="64" cy="54" r="1.5" fill="currentColor" />
      <circle cx="86" cy="54" r="1.5" fill="currentColor" />
      {/* Tusks & Mouth */}
      <path d="M62 76 L66 65 L70 76 M88 76 L84 65 L80 76" strokeWidth="1.4" />
      <path d="M65 72 H85" />
      {/* Armor Shoulder Spikes */}
      <path d="M52 58 L32 50 L40 68 L52 70" />
      <path d="M98 58 L118 50 L110 68 L98 70" />
      {/* Chest Details & War Markings */}
      <path d="M75 42 V65 M68 45 L82 45 M65 82 L75 88 L85 82" />
      <path d="M45 105 L75 95 L105 105" />
    </g>
  );
}

function Dragon() {
  return (
    <g className="animate-fade-in">
      {/* Horned Dragon Head */}
      <path d="M85 30 Q120 25 135 45 Q115 50 100 55 Q75 60 60 75" strokeWidth="1.5" />
      <path d="M95 30 C90 15, 70 10, 65 18 C75 22, 85 28, 88 32" />
      <path d="M102 32 C105 15, 125 10, 130 15 C122 22, 110 28, 105 34" />
      {/* Eye & Snout */}
      <circle cx="108" cy="40" r="2" fill="currentColor" />
      <path d="M105 36 L118 36" />
      <path d="M128 42 L132 43" />
      {/* Teeth & Fire embers */}
      <path d="M115 50 L120 46 L125 50 L130 46" />
      <path d="M135 45 Q145 42 148 48 Q140 52 130 50" />
      {/* Wing Ribs */}
      <path d="M60 75 C45 45, 20 40, 15 55 C35 55, 45 68, 50 82" strokeWidth="1.3" />
      <path d="M15 55 C28 65, 32 80, 42 88" />
      <path d="M30 42 C42 48, 50 60, 55 72" opacity="0.6" />
      {/* Neck scales & Body */}
      <path d="M60 75 C65 92, 50 108, 30 110 C48 112, 75 105, 80 88" />
      <path d="M72 65 C76 72, 74 80, 70 88 M80 72 C85 80, 82 88, 76 95" opacity="0.5" />
    </g>
  );
}

function Skeleton() {
  return (
    <g className="animate-fade-in">
      {/* Skull Outline */}
      <path d="M75 18 C55 18, 52 36, 55 48 C58 55, 62 58, 62 65 H88 C88 58, 92 55, 95 48 C98 36, 95 18, 75 18 Z" strokeWidth="1.4" />
      {/* Eye Sockets & Nose */}
      <circle cx="66" cy="38" r="5" strokeWidth="1.3" />
      <circle cx="84" cy="38" r="5" strokeWidth="1.3" />
      <path d="M75 46 L72 52 H78 Z" fill="currentColor" />
      {/* Teeth */}
      <path d="M65 65 V71 M70 65 V71 M75 65 V71 M80 65 V71 M85 65 V71" strokeWidth="1.3" />
      <path d="M63 71 H87" />
      {/* Spine & Ribcage */}
      <path d="M75 71 V112" strokeWidth="1.5" />
      <path d="M60 78 C65 74, 85 74, 90 78" />
      <path d="M56 86 C64 81, 86 81, 94 86" />
      <path d="M58 94 C65 90, 85 90, 92 94" />
      <path d="M62 102 C68 98, 82 98, 88 102" />
      {/* Shoulders */}
      <path d="M60 76 L40 85 M90 76 L110 85" strokeWidth="1.4" />
    </g>
  );
}

function Shadow() {
  return (
    <g className="animate-fade-in">
      {/* Ethereal Shadow Hood & Body */}
      <path d="M75 15 C50 15, 38 40, 42 75 C45 100, 30 110, 48 112 C60 102, 70 112, 75 105 C80 112, 90 102, 102 112 C120 110, 105 100, 108 75 C112 40, 100 15, 75 15 Z" strokeWidth="1.4" />
      {/* Glowing Eyes inside Dark Void */}
      <ellipse cx="64" cy="48" rx="4" ry="2.5" fill="currentColor" className="animate-pulse" />
      <ellipse cx="86" cy="48" rx="4" ry="2.5" fill="currentColor" className="animate-pulse" />
      {/* Inner Shadow Swirl Lines */}
      <path d="M52 65 C60 55, 90 55, 98 65" opacity="0.6" />
      <path d="M48 80 C60 90, 90 90, 102 80" opacity="0.5" />
      <path d="M58 40 C68 32, 82 32, 92 40" opacity="0.4" />
      <path d="M25 85 C35 70, 40 90, 30 105" opacity="0.4" />
      <path d="M125 85 C115 70, 110 90, 120 105" opacity="0.4" />
    </g>
  );
}

function DesertSpirit() {
  return (
    <g className="animate-fade-in">
      {/* Swirling Sand Vortex */}
      <path d="M75 12 C60 25, 58 42, 75 54 C92 42, 90 25, 75 12 Z" strokeWidth="1.4" />
      {/* Crown / Mask */}
      <path d="M62 30 H88 M65 36 H85" />
      <circle cx="68" cy="24" r="1.5" fill="currentColor" />
      <circle cx="82" cy="24" r="1.5" fill="currentColor" />
      {/* Tornado Body Waves */}
      <path d="M75 54 C50 62, 42 75, 80 82 C115 88, 35 98, 75 112" strokeWidth="1.4" />
      <path d="M75 58 C95 65, 90 78, 60 84 C38 90, 100 100, 65 110" opacity="0.6" />
      {/* Dust Embers */}
      <circle cx="35" cy="65" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="115" cy="75" r="1" fill="currentColor" opacity="0.5" />
      <circle cx="45" cy="100" r="1" fill="currentColor" opacity="0.5" />
      <path d="M20 112 Q75 102 130 112" opacity="0.3" strokeDasharray="3 3" />
    </g>
  );
}

function Chest() {
  return (
    <g className="animate-fade-in">
      {/* Vault Chest Lid */}
      <path d="M30 50 L45 25 H105 L120 50 Z" strokeWidth="1.4" />
      <path d="M30 50 H120 V95 C120 98, 116 102, 112 102 H38 C34 102, 30 98, 30 95 Z" strokeWidth="1.5" />
      {/* Iron Banding & Corner Guards */}
      <path d="M50 25 V102 M100 25 V102" strokeWidth="1.3" />
      <path d="M30 70 H120" strokeWidth="1.2" />
      {/* Lock Plate & Keyhole */}
      <rect x="66" y="58" width="18" height="22" rx="3" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="75" cy="66" r="2.5" fill="currentColor" />
      <path d="M75 68.5 V75" strokeWidth="1.5" />
      {/* Radiant Light Beams */}
      <path d="M75 18 V8 M50 15 L42 8 M100 15 L108 8" opacity="0.7" />
    </g>
  );
}

function Castle() {
  return (
    <g className="animate-fade-in">
      {/* Main Keep Wall */}
      <path d="M35 105 V50 H115 V105 Z" strokeWidth="1.4" />
      {/* Battlements */}
      <path d="M35 50 H43 V42 H51 V50 H59 V42 H67 V50 H83 V42 H91 V50 H99 V42 H107 V50 H115" strokeWidth="1.3" />
      {/* Central High Tower */}
      <path d="M58 42 V22 H92 V42" strokeWidth="1.4" />
      <path d="M58 22 H64 V16 H72 V22 H78 V16 H86 V22 H92" strokeWidth="1.2" />
      {/* Flag Banner */}
      <path d="M75 16 V5 L90 10 L75 15" strokeWidth="1.2" />
      {/* Archway Gate */}
      <path d="M63 105 V82 C63 74, 87 74, 87 82 V105 Z" strokeWidth="1.5" />
      <path d="M75 75 V105 M63 90 H87" opacity="0.6" />
    </g>
  );
}

function BossDemon() {
  return (
    <g className="animate-fade-in">
      {/* Giant Horns */}
      <path d="M55 42 C45 25, 20 15, 15 35 C28 35, 45 42, 52 48" strokeWidth="1.5" />
      <path d="M95 42 C105 25, 130 15, 135 35 C122 35, 105 42, 98 48" strokeWidth="1.5" />
      {/* Crown & Head */}
      <path d="M52 48 L75 32 L98 48 V75 C98 88, 75 98, 75 98 C75 98, 52 88, 52 75 Z" strokeWidth="1.5" />
      {/* Glowing Fiery Eyes */}
      <polygon points="60,54 70,58 62,62" fill="currentColor" />
      <polygon points="90,54 80,58 88,62" fill="currentColor" />
      {/* Sharp Fangs */}
      <path d="M62 76 L66 84 L70 76 M88 76 L84 84 L80 76" strokeWidth="1.4" />
      <path d="M60 74 H90" />
      {/* Shoulder Armor & Flames */}
      <path d="M42 60 L20 68 L32 85 L52 78" />
      <path d="M108 60 L130 68 L118 85 L98 78" />
    </g>
  );
}

function MagicPortal() {
  return (
    <g className="animate-fade-in">
      {/* Outer Arcane Ring */}
      <circle cx="75" cy="60" r="42" strokeWidth="1.4" strokeDasharray="6 3" />
      <circle cx="75" cy="60" r="34" strokeWidth="1.2" />
      <circle cx="75" cy="60" r="24" strokeWidth="1.5" className="animate-pulse" />
      {/* Swirling Galaxy Core */}
      <path d="M75 36 C90 36, 99 50, 75 60 C51 70, 60 84, 75 84" strokeWidth="1.3" />
      {/* Star Runes */}
      <path d="M75 12 V22 M75 98 V108 M27 60 H37 M113 60 H123" strokeWidth="1.3" />
      <circle cx="75" cy="60" r="4" fill="currentColor" />
    </g>
  );
}
