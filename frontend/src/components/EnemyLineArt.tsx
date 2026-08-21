import type { EnemyLineArtType, Language } from '../types/game';

export function EnemyLineArt({
  imageUrl,
  turnNumber,
  isLatest = false,
  language = 'fa',
  className = '',
}: {
  type?: EnemyLineArtType;
  asciiArt?: string | null;
  svgArt?: string | null;
  imageUrl?: string | null;
  turnNumber?: number;
  isLatest?: boolean;
  language?: Language;
  className?: string;
}) {
  const isMockImage = Boolean(imageUrl?.includes('RAML AI Image Generator') || imageUrl?.includes('Mock Mode'));

  // 1. Real AI Generated Image (TokenBazaar AI / Flux-2-Pro)
  if (imageUrl && !isMockImage) {
    return (
      <div className={`flex justify-center py-2.5 ${className}`} aria-hidden>
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

  // 2. Minimal Loading Skeleton ONLY for active latest turn (turn >= 5) while waiting for AI image
  if (isLatest && (turnNumber === undefined || turnNumber >= 5)) {
    return (
      <div className={`flex justify-center py-2.5 ${className}`} aria-hidden>
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-amber/20 bg-zinc-950/60 p-2 backdrop-blur-sm shadow-sm shadow-amber/5">
          <div className="relative flex h-48 sm:h-56 w-full items-center justify-center overflow-hidden rounded-lg border border-amber/10 bg-zinc-900/30">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber/[0.04] to-transparent animate-pulse" />
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-amber/10 text-amber">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. For past turns without image or turns < 5, return null
  return null;
}
