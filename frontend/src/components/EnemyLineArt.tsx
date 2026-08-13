import type { EnemyLineArtType, Language } from '../types/game';

export function EnemyLineArt({
  imageUrl,
  language = 'fa',
  className = '',
}: {
  type?: EnemyLineArtType;
  asciiArt?: string | null;
  svgArt?: string | null;
  imageUrl?: string | null;
  turnNumber?: number;
  language?: Language;
  className?: string;
}) {
  const isEn = language === 'en';
  const isMockImage = Boolean(imageUrl?.includes('RAML AI Image Generator') || imageUrl?.includes('Mock Mode'));

  // 1. Real AI Generated Image (TokenBazaar AI / Flux-2-Pro)
  if (imageUrl && !isMockImage) {
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

  // 2. Loading Box until real AI image arrives (No line art, SVGs, or mock images)
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
