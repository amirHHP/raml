import type { EnemyLineArtType, Language } from '../types/game';

/** Pre-rendered character line art (ASCII/Unicode) fallbacks */
const DEFAULT_PRESET_ASCII: Partial<Record<EnemyLineArtType, string>> = {
  orc_guardian: `
       / \\__/__\\
      (  o   o  )
      |   ---   |
     /|  / | \\  |\\
    / |  |_|_|  | \\
   (  (_)     (_)  )
  `,
  dragon: `
         /\\_/\\
        ( o.o )
         > ^ <   ~~\\
        /     \\    ||
       (  |||  )  //
        \\_|||_/  //
  `,
  skeleton: `
        .-----.
       /  o o  \\
      |   ___   |
       \\  \\_/  /
        '-----'
          | |
        --|-|--
          | |
  `,
  shadow: `
       ┌─────────────┐
       │   .-----..  │
       │  /  o o  \\  │
       │ |   ___   | │
       │  \\  \\_/  /  │
       │   '-----'   │
       └─────────────┘
  `,
  desert_spirit: `
       ┌─────────────┐
       │   (~~~~~)   │
       │  /  o o  \\  │
       │ (   .-.   ) │
       │  \\  \`-'  /  │
       │   \`~~~~~\'   │
       └─────────────┘
  `,
  chest: `
      .-----------------------.
      |  ╔═════════════════╗  |
      |  ║  [ 🗝️ ] ✨   ║  |
      |  ╚═════════════════╝  |
      '-----------------------'
  `,
  castle: `
       ┌─────────────┐
       │  /\\  /\\  /\\ │
       │ |  ||  ||  |│
       │ |__||__||__|│
       │ |   ||   |  │
       │ |___||___|__|│
       └─────────────┘
  `,
  boss_demon: `
       ┌─────────────┐
       │  /\\     /\\  │
       │ (  o.o  )   │
       │  > ^ <      │
       │  /  |  \    │
       └─────────────┘
  `,
  magic_portal: `
       ┌─────────────┐
       │   .---.     │
       │  /  ✦  \\    │
       │ |  (O)  |   │
       │  \\  ✦  /    │
       │   '---'     │
       └─────────────┘
  `,
  ancient_tree: `
          v .   .v
       . v  v v
       v  (   ) v
        v  | |  v
       ~~~~/ \\~~~~
  `,
  phoenix: `
       \\    /\\    /
        \\  (o)  /
         (  ^  )
          \\_v_/
  `,
  mystic_potion: `
         .---.
        (  o  )
        |=====|
        (     )
         '---'
  `,
  ruined_altar: `
       .-------.
       | [ ✦ ] |
       |_______|
        |  |  |
  `,
  wolf: `
        /\\__/\\
       (  . . )
       (   v  )
  `,
};

/** Distinct color theme mappings per scene/monster type */
const TYPE_COLOR_MAP: Record<EnemyLineArtType, { stroke: string; glow: string }> = {
  orc_guardian: { stroke: 'text-amber-400', glow: 'rgba(245,158,11,0.3)' },
  dragon: { stroke: 'text-rose-400', glow: 'rgba(244,63,94,0.35)' },
  skeleton: { stroke: 'text-emerald-300', glow: 'rgba(52,211,153,0.3)' },
  shadow: { stroke: 'text-purple-400', glow: 'rgba(168,85,247,0.35)' },
  desert_spirit: { stroke: 'text-yellow-300', glow: 'rgba(253,224,71,0.3)' },
  chest: { stroke: 'text-amber-300', glow: 'rgba(252,211,77,0.35)' },
  castle: { stroke: 'text-sky-300', glow: 'rgba(125,211,252,0.3)' },
  boss_demon: { stroke: 'text-red-500', glow: 'rgba(239,68,68,0.4)' },
  magic_portal: { stroke: 'text-cyan-300', glow: 'rgba(103,232,249,0.35)' },
  ancient_tree: { stroke: 'text-teal-400', glow: 'rgba(45,212,191,0.3)' },
  phoenix: { stroke: 'text-orange-400', glow: 'rgba(251,146,60,0.35)' },
  mystic_potion: { stroke: 'text-violet-400', glow: 'rgba(167,139,250,0.35)' },
  ruined_altar: { stroke: 'text-indigo-300', glow: 'rgba(165,180,252,0.3)' },
  wolf: { stroke: 'text-blue-400', glow: 'rgba(96,165,250,0.3)' },
  none: { stroke: 'text-amber-300/80', glow: 'rgba(245,158,11,0.2)' },
};

/**
 * Clean & sanitize AI-generated SVG code snippet if present.
 */
function sanitizeSvgSnippet(rawSvg: string): string {
  const trimmed = rawSvg.trim();
  if (trimmed.startsWith('<svg') && trimmed.endsWith('</svg>')) {
    return trimmed;
  }
  const innerPath = trimmed.replace(/^```(xml|svg)?/i, '').replace(/```$/i, '').trim();
  if (innerPath.startsWith('<path') || innerPath.startsWith('<g') || innerPath.startsWith('<circle')) {
    return `<svg width="150" height="120" viewBox="0 0 150 120" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">${innerPath}</svg>`;
  }
  return '';
}

/**
 * Renders dynamic AI SVG (`svgArt`), AI character line art (`asciiArt`), or
 * rich handcrafted SVG vector illustrations keyed by `type`.
 */
export function EnemyLineArt({
  type,
  asciiArt,
  svgArt,
  imageUrl,
  turnNumber = 0,
  language = 'fa',
  className = '',
}: {
  type: EnemyLineArtType;
  asciiArt?: string | null;
  svgArt?: string | null;
  imageUrl?: string | null;
  turnNumber?: number;
  language?: Language;
  className?: string;
}) {
  const isEn = language === 'en';
  const isAiTurn = turnNumber >= 5;

  // 1. AI Generated Image (TokenBazaar AI / Flux-2-Pro / Mock SVG Data URL)
  if (imageUrl) {
    return (
      <div className={`flex justify-center py-3 ${className}`} aria-hidden>
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-amber/30 bg-zinc-950/90 p-2 shadow-md shadow-amber/5 backdrop-blur-sm">
          <div className="overflow-hidden rounded-lg border border-line/40 bg-black">
            <img
              src={imageUrl}
              alt="تصویر صحنه"
              className="w-full max-h-72 object-cover rounded-md"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading box for live AI turns (turn >= 5) while waiting for background image generation
  if (isAiTurn) {
    return (
      <div className={`flex justify-center py-3 ${className}`} aria-hidden>
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-amber/30 bg-zinc-950/90 p-4 shadow-md shadow-amber/5 backdrop-blur-sm space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-amber/15 text-[10px] text-amber/60 font-mono tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber animate-ping" />
              {isEn ? 'AI Image Generation' : 'تصویرگری هوش مصنوعی'}
            </span>
            <span className="animate-pulse">{isEn ? 'Generating...' : 'در حال تولید...'}</span>
          </div>
          <div className="flex flex-col items-center justify-center h-44 rounded-lg border border-dashed border-amber/30 bg-black/60 p-4 text-center">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-amber/10 text-amber animate-spin mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-amber/80 font-medium animate-pulse">
              {isEn ? 'Generating scene illustration...' : 'در حال ساخت تصویر صحنه...'}
            </p>
            <p className="text-[10px] text-ink-muted mt-1">
              {isEn ? 'Text is ready, image will appear shortly' : 'پاسخ متنی آماده است، تصویر به‌زودی اضافه می‌شود'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const customSvg = svgArt ? sanitizeSvgSnippet(svgArt) : '';
  const customAscii = asciiArt?.trim();
  const effectiveType: EnemyLineArtType = type && type !== 'none' ? type : 'shadow';
  const theme = TYPE_COLOR_MAP[effectiveType] || TYPE_COLOR_MAP.none;

  // 1. AI-generated custom SVG rendering
  if (customSvg) {
    return (
      <div className={`flex justify-center py-3 ${className}`} aria-hidden>
        <div
          className={`relative flex items-center justify-center rounded-xl border border-white/10 bg-zinc-950/70 p-3 shadow-inner ${theme.stroke}`}
          style={{ filter: `drop-shadow(0 0 10px ${theme.glow})` }}
          dangerouslySetInnerHTML={{ __html: customSvg }}
        />
      </div>
    );
  }

  // 2. AI-generated custom ASCII character line art
  if (customAscii) {
    return (
      <div className={`flex justify-center py-3 ${className}`} aria-hidden>
        <div className="w-full max-w-sm overflow-x-auto rounded-xl border border-amber/30 bg-zinc-950/90 p-3.5 shadow-md shadow-amber/5 backdrop-blur-sm">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-amber/15 text-[10px] text-amber/60 font-mono tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              تصویرگری AI
            </span>
            <span>Raml Line-Art</span>
          </div>
          <pre className="font-mono text-[12px] leading-[1.3] text-amber text-center whitespace-pre overflow-x-auto selection:bg-amber/20 select-none py-1">
            {customAscii}
          </pre>
        </div>
      </div>
    );
  }

  // 3. Fallback: Handcrafted Detailed SVG Vector Illustration
  if (!type || type === 'none') {
    const fallbackAscii = DEFAULT_PRESET_ASCII[effectiveType];
    if (fallbackAscii) {
      return (
        <div className={`flex justify-center py-3 ${className}`} aria-hidden>
          <div className="w-full max-w-sm overflow-x-auto rounded-xl border border-amber/30 bg-zinc-950/90 p-3.5 shadow-md shadow-amber/5">
            <pre className="font-mono text-[12px] leading-[1.3] text-amber text-center whitespace-pre overflow-x-auto py-1">
              {fallbackAscii.trim()}
            </pre>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`flex justify-center py-3 ${className}`} aria-hidden>
      <div
        className={`relative flex items-center justify-center rounded-xl border border-white/10 bg-zinc-950/70 p-3 shadow-inner ${theme.stroke}`}
        style={{ filter: `drop-shadow(0 0 10px ${theme.glow})` }}
      >
        <svg
          width="150"
          height="120"
          viewBox="0 0 150 120"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {effectiveType === 'orc_guardian' && <OrcGuardian />}
          {effectiveType === 'dragon' && <Dragon />}
          {effectiveType === 'skeleton' && <Skeleton />}
          {effectiveType === 'shadow' && <Shadow />}
          {effectiveType === 'desert_spirit' && <DesertSpirit />}
          {effectiveType === 'chest' && <Chest />}
          {effectiveType === 'castle' && <Castle />}
          {effectiveType === 'boss_demon' && <BossDemon />}
          {effectiveType === 'magic_portal' && <MagicPortal />}
          {effectiveType === 'ancient_tree' && <AncientTree />}
          {effectiveType === 'phoenix' && <Phoenix />}
          {effectiveType === 'mystic_potion' && <MysticPotion />}
          {effectiveType === 'ruined_altar' && <RuinedAltar />}
          {effectiveType === 'wolf' && <Wolf />}
        </svg>
      </div>
    </div>
  );
}

function OrcGuardian() {
  return (
    <g className="animate-fade-in">
      <path d="M50 42 L75 22 L100 42" strokeWidth="1.5" />
      <path d="M42 35 C40 20, 25 15, 20 22 C30 28, 45 35, 52 42" />
      <path d="M108 35 C110 20, 125 15, 130 22 C120 28, 105 35, 98 42" />
      <path d="M52 42 H98 V70 C98 85, 75 95, 75 95 C75 95, 52 85, 52 70 Z" strokeWidth="1.4" />
      <path d="M60 52 L68 55 L60 58 M90 52 L82 55 L90 58" strokeWidth="1.3" />
      <circle cx="64" cy="54" r="1.5" fill="currentColor" />
      <circle cx="86" cy="54" r="1.5" fill="currentColor" />
      <path d="M62 76 L66 65 L70 76 M88 76 L84 65 L80 76" strokeWidth="1.4" />
      <path d="M65 72 H85" />
      <path d="M52 58 L32 50 L40 68 L52 70" />
      <path d="M98 58 L118 50 L110 68 L98 70" />
      <path d="M75 42 V65 M68 45 L82 45 M65 82 L75 88 L85 82" />
      <path d="M45 105 L75 95 L105 105" />
    </g>
  );
}

function Dragon() {
  return (
    <g className="animate-fade-in">
      <path d="M85 30 Q120 25 135 45 Q115 50 100 55 Q75 60 60 75" strokeWidth="1.5" />
      <path d="M95 30 C90 15, 70 10, 65 18 C75 22, 85 28, 88 32" />
      <path d="M102 32 C105 15, 125 10, 130 15 C122 22, 110 28, 105 34" />
      <circle cx="108" cy="40" r="2" fill="currentColor" />
      <path d="M105 36 L118 36" />
      <path d="M128 42 L132 43" />
      <path d="M115 50 L120 46 L125 50 L130 46" />
      <path d="M135 45 Q145 42 148 48 Q140 52 130 50" />
      <path d="M60 75 C45 45, 20 40, 15 55 C35 55, 45 68, 50 82" strokeWidth="1.3" />
      <path d="M15 55 C28 65, 32 80, 42 88" />
      <path d="M30 42 C42 48, 50 60, 55 72" opacity="0.6" />
      <path d="M60 75 C65 92, 50 108, 30 110 C48 112, 75 105, 80 88" />
      <path d="M72 65 C76 72, 74 80, 70 88 M80 72 C85 80, 82 88, 76 95" opacity="0.5" />
    </g>
  );
}

function Skeleton() {
  return (
    <g className="animate-fade-in">
      <path d="M75 18 C55 18, 52 36, 55 48 C58 55, 62 58, 62 65 H88 C88 58, 92 55, 95 48 C98 36, 95 18, 75 18 Z" strokeWidth="1.4" />
      <circle cx="66" cy="38" r="5" strokeWidth="1.3" />
      <circle cx="84" cy="38" r="5" strokeWidth="1.3" />
      <path d="M75 46 L72 52 H78 Z" fill="currentColor" />
      <path d="M65 65 V71 M70 65 V71 M75 65 V71 M80 65 V71 M85 65 V71" strokeWidth="1.3" />
      <path d="M63 71 H87" />
      <path d="M75 71 V112" strokeWidth="1.5" />
      <path d="M60 78 C65 74, 85 74, 90 78" />
      <path d="M56 86 C64 81, 86 81, 94 86" />
      <path d="M58 94 C65 90, 85 90, 92 94" />
      <path d="M62 102 C68 98, 82 98, 88 102" />
      <path d="M60 76 L40 85 M90 76 L110 85" strokeWidth="1.4" />
    </g>
  );
}

function Shadow() {
  return (
    <g className="animate-fade-in">
      <path d="M75 15 C50 15, 38 40, 42 75 C45 100, 30 110, 48 112 C60 102, 70 112, 75 105 C80 112, 90 102, 102 112 C120 110, 105 100, 108 75 C112 40, 100 15, 75 15 Z" strokeWidth="1.4" />
      <ellipse cx="64" cy="48" rx="4" ry="2.5" fill="currentColor" className="animate-pulse" />
      <ellipse cx="86" cy="48" rx="4" ry="2.5" fill="currentColor" className="animate-pulse" />
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
      <path d="M75 12 C60 25, 58 42, 75 54 C92 42, 90 25, 75 12 Z" strokeWidth="1.4" />
      <path d="M62 30 H88 M65 36 H85" />
      <circle cx="68" cy="24" r="1.5" fill="currentColor" />
      <circle cx="82" cy="24" r="1.5" fill="currentColor" />
      <path d="M75 54 C50 62, 42 75, 80 82 C115 88, 35 98, 75 112" strokeWidth="1.4" />
      <path d="M75 58 C95 65, 90 78, 60 84 C38 90, 100 100, 65 110" opacity="0.6" />
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
      <path d="M30 50 L45 25 H105 L120 50 Z" strokeWidth="1.4" />
      <path d="M30 50 H120 V95 C120 98, 116 102, 112 102 H38 C34 102, 30 98, 30 95 Z" strokeWidth="1.5" />
      <path d="M50 25 V102 M100 25 V102" strokeWidth="1.3" />
      <path d="M30 70 H120" strokeWidth="1.2" />
      <rect x="66" y="58" width="18" height="22" rx="3" strokeWidth="1.4" fill="currentColor" fillOpacity="0.1" />
      <circle cx="75" cy="66" r="2.5" fill="currentColor" />
      <path d="M75 68.5 V75" strokeWidth="1.5" />
      <path d="M75 18 V8 M50 15 L42 8 M100 15 L108 8" opacity="0.7" />
    </g>
  );
}

function Castle() {
  return (
    <g className="animate-fade-in">
      <path d="M35 105 V50 H115 V105 Z" strokeWidth="1.4" />
      <path d="M35 50 H43 V42 H51 V50 H59 V42 H67 V50 H83 V42 H91 V50 H99 V42 H107 V50 H115" strokeWidth="1.3" />
      <path d="M58 42 V22 H92 V42" strokeWidth="1.4" />
      <path d="M58 22 H64 V16 H72 V22 H78 V16 H86 V22 H92" strokeWidth="1.2" />
      <path d="M75 16 V5 L90 10 L75 15" strokeWidth="1.2" />
      <path d="M63 105 V82 C63 74, 87 74, 87 82 V105 Z" strokeWidth="1.5" />
      <path d="M75 75 V105 M63 90 H87" opacity="0.6" />
    </g>
  );
}

function BossDemon() {
  return (
    <g className="animate-fade-in">
      <path d="M55 42 C45 25, 20 15, 15 35 C28 35, 45 42, 52 48" strokeWidth="1.5" />
      <path d="M95 42 C105 25, 130 15, 135 35 C122 35, 105 42, 98 48" strokeWidth="1.5" />
      <path d="M52 48 L75 32 L98 48 V75 C98 88, 75 98, 75 98 C75 98, 52 88, 52 75 Z" strokeWidth="1.5" />
      <polygon points="60,54 70,58 62,62" fill="currentColor" />
      <polygon points="90,54 80,58 88,62" fill="currentColor" />
      <path d="M62 76 L66 84 L70 76 M88 76 L84 84 L80 76" strokeWidth="1.4" />
      <path d="M60 74 H90" />
      <path d="M42 60 L20 68 L32 85 L52 78" />
      <path d="M108 60 L130 68 L118 85 L98 78" />
    </g>
  );
}

function MagicPortal() {
  return (
    <g className="animate-fade-in">
      <circle cx="75" cy="60" r="42" strokeWidth="1.4" strokeDasharray="6 3" />
      <circle cx="75" cy="60" r="34" strokeWidth="1.2" />
      <circle cx="75" cy="60" r="24" strokeWidth="1.5" className="animate-pulse" />
      <path d="M75 36 C90 36, 99 50, 75 60 C51 70, 60 84, 75 84" strokeWidth="1.3" />
      <path d="M75 12 V22 M75 98 V108 M27 60 H37 M113 60 H123" strokeWidth="1.3" />
      <circle cx="75" cy="60" r="4" fill="currentColor" />
    </g>
  );
}

function AncientTree() {
  return (
    <g className="animate-fade-in">
      {/* Twisted Trunk & Hollow */}
      <path d="M62 110 C58 85, 52 70, 40 55 M88 110 C92 85, 98 70, 110 55" strokeWidth="1.6" />
      <path d="M62 110 C70 95, 80 95, 88 110" />
      <ellipse cx="75" cy="78" rx="10" ry="16" strokeWidth="1.4" fill="currentColor" fillOpacity="0.15" />
      {/* Spooky Gnarled Branches */}
      <path d="M40 55 C25 42, 18 25, 12 30 M40 55 C48 38, 35 22, 28 15" strokeWidth="1.4" />
      <path d="M110 55 C125 42, 132 25, 138 30 M110 55 C102 38, 115 22, 122 15" strokeWidth="1.4" />
      <path d="M75 62 V30 C65 20, 85 20, 75 10" strokeWidth="1.4" />
      {/* Glowing Runes on Trunk */}
      <circle cx="75" cy="74" r="2" fill="currentColor" className="animate-pulse" />
    </g>
  );
}

function Phoenix() {
  return (
    <g className="animate-fade-in">
      {/* Firebird Crest & Head */}
      <path d="M75 18 C70 12, 75 5, 75 5 C75 5, 80 12, 75 18 Z" strokeWidth="1.3" />
      <circle cx="75" cy="24" r="8" strokeWidth="1.4" />
      <path d="M71 22 L73 22 M77 22 L79 22 M75 28 L78 32 L72 32 Z" fill="currentColor" />
      {/* Majestic Outstretched Fiery Wings */}
      <path d="M68 28 C45 15, 20 20, 10 38 C30 40, 48 48, 62 55" strokeWidth="1.5" />
      <path d="M82 28 C105 15, 130 20, 140 38 C120 40, 102 48, 88 55" strokeWidth="1.5" />
      <path d="M15 42 C32 46, 48 55, 58 65 M135 42 C118 46, 102 55, 92 65" strokeWidth="1.3" />
      {/* Body & Flame Tail */}
      <path d="M62 55 Q75 75 75 112 Q75 75 88 55 Z" strokeWidth="1.4" />
      <path d="M75 70 C65 85, 55 105, 50 115 M75 70 C85 85, 95 105, 100 115" strokeWidth="1.3" />
    </g>
  );
}

function MysticPotion() {
  return (
    <g className="animate-fade-in">
      {/* Cork Top & Neck */}
      <rect x="68" y="15" width="14" height="10" rx="2" strokeWidth="1.4" />
      <path d="M66 25 H84 V38 L55 58 V100 C55 106, 60 110, 68 110 H82 C90 110, 95 106, 95 100 V58 L84 38 V25" strokeWidth="1.5" />
      {/* Bubbling Liquid Level & Swirls */}
      <path d="M57 65 C68 60, 82 72, 93 65" strokeWidth="1.3" />
      <circle cx="70" cy="80" r="3" strokeWidth="1.2" />
      <circle cx="82" cy="90" r="4" strokeWidth="1.2" />
      <circle cx="68" cy="95" r="2" fill="currentColor" className="animate-pulse" />
      <circle cx="75" cy="48" r="1.5" fill="currentColor" className="animate-pulse" />
    </g>
  );
}

function RuinedAltar() {
  return (
    <g className="animate-fade-in">
      {/* Broken Stone Pedestal Base */}
      <path d="M25 105 H125 L115 90 H35 Z" strokeWidth="1.4" />
      <path d="M40 90 V55 H110 V90" strokeWidth="1.4" />
      <path d="M20 55 H130 L120 42 H30 Z" strokeWidth="1.5" />
      {/* Ancient Engravings & Cracks */}
      <path d="M55 55 V90 M95 55 V90" strokeWidth="1.2" />
      <path d="M68 62 L74 72 L66 82" strokeWidth="1.2" />
      {/* Floating Arcane Rune Gem */}
      <polygon points="75,12 88,28 75,44 62,28" strokeWidth="1.5" />
      <circle cx="75" cy="28" r="3" fill="currentColor" className="animate-pulse" />
      <path d="M75 5 V0 M55 20 L48 15 M95 20 L102 15" opacity="0.6" />
    </g>
  );
}

function Wolf() {
  return (
    <g className="animate-fade-in">
      {/* Snarling Wolf Head & Sharp Ears */}
      <path d="M45 40 L35 15 L58 32 L78 30 L98 25 L88 45 Z" strokeWidth="1.5" />
      <circle cx="62" cy="36" r="2" fill="currentColor" />
      <path d="M35 15 L48 30" opacity="0.6" />
      {/* Snout & Fangs */}
      <path d="M88 45 L112 50 L92 60 L78 52 Z" strokeWidth="1.4" />
      <path d="M102 52 L98 58 M94 54 L92 59" strokeWidth="1.3" />
      {/* Body & Paws */}
      <path d="M52 42 C40 55, 30 75, 25 105 M78 52 C70 70, 75 90, 85 105" strokeWidth="1.5" />
      <path d="M45 68 C55 80, 50 95, 55 105" strokeWidth="1.3" />
      <path d="M20 105 H32 M50 105 H62 M80 105 H92" strokeWidth="1.5" />
    </g>
  );
}
