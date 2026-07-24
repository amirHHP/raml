import type { EnemyLineArtType } from '../types/game';

/** Minimal SVG line-art keyed by AI `enemy_line_art_type`. */
export function EnemyLineArt({
  type,
  className = '',
}: {
  type: EnemyLineArtType;
  className?: string;
}) {
  if (type === 'none') return null;

  return (
    <div className={`flex justify-center py-3 ${className}`} aria-hidden>
      <svg
        width="120"
        height="100"
        viewBox="0 0 120 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        className="text-ink-dim opacity-80"
      >
        {type === 'orc_guardian' && <OrcGuardian />}
        {type === 'dragon' && <Dragon />}
        {type === 'skeleton' && <Skeleton />}
        {type === 'shadow' && <Shadow />}
        {type === 'desert_spirit' && <DesertSpirit />}
      </svg>
    </div>
  );
}

function OrcGuardian() {
  return (
    <>
      <path d="M35 88 V55 L48 40 H72 L85 55 V88" />
      <path d="M48 40 L60 22 L72 40" />
      <circle cx="52" cy="52" r="2" fill="currentColor" />
      <circle cx="68" cy="52" r="2" fill="currentColor" />
      <path d="M54 62 H66" />
      <path d="M42 48 L28 38 M78 48 L92 38" />
      <path d="M50 88 L45 98 M70 88 L75 98" />
    </>
  );
}

function Dragon() {
  return (
    <>
      <path d="M20 70 C40 40, 55 35, 70 45 C85 55, 95 50, 100 40" />
      <path d="M70 45 L78 28 L72 30" />
      <path d="M55 55 L40 75 M62 58 L55 80" />
      <path d="M48 48 C35 35, 25 45, 30 55" />
      <circle cx="82" cy="42" r="1.5" fill="currentColor" />
    </>
  );
}

function Skeleton() {
  return (
    <>
      <circle cx="60" cy="28" r="12" />
      <path d="M55 26 H57 M63 26 H65 M54 34 H66" />
      <path d="M60 40 V68" />
      <path d="M60 48 L42 58 M60 48 L78 58" />
      <path d="M60 68 L48 90 M60 68 L72 90" />
      <path d="M52 58 H68" />
    </>
  );
}

function Shadow() {
  return (
    <>
      <path d="M60 20 C40 35, 35 60, 45 85 C55 70, 65 70, 75 85 C85 60, 80 35, 60 20Z" />
      <circle cx="52" cy="48" r="2" fill="currentColor" />
      <circle cx="68" cy="48" r="2" fill="currentColor" />
    </>
  );
}

function DesertSpirit() {
  return (
    <>
      <path d="M60 18 C48 30, 48 50, 60 62 C72 50, 72 30, 60 18Z" />
      <path d="M60 62 C40 70, 35 85, 40 95 M60 62 C80 70, 85 85, 80 95" />
      <path d="M52 40 H56 M64 40 H68" />
      <path d="M20 92 Q60 80 100 92" opacity="0.5" />
    </>
  );
}
