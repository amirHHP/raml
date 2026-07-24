import { useState } from 'react';
import { useWordTypewriter } from '../hooks/useWordTypewriter';

export function AwakenScreen({
  storyText,
  busy,
  onAwaken,
}: {
  storyText: string;
  busy: boolean;
  onAwaken: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');

  // Keep only the first atmospheric block (older saves may still have a second paragraph).
  const intro = storyText.split(/\n\n/)[0]?.trim() || storyText.trim();
  const { displayed, done, skip } = useWordTypewriter(intro, 580);

  return (
    <div className="relative flex flex-1 flex-col bg-oled px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <button
          type="button"
          onClick={skip}
          className="mb-10 w-full text-center"
          aria-label="متن آغازین"
        >
          <p className="whitespace-pre-wrap text-[15px] leading-8 text-ink-dim">
            {displayed}
            {!done && (
              <span className="mr-0.5 inline-block w-1.5 animate-pulse bg-ink-muted align-middle">
                {' '}
              </span>
            )}
          </p>
        </button>

        <div
          className={`flex flex-col items-stretch transition-opacity duration-[1400ms] ease-out ${
            done ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <input
            id="char-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            placeholder="اسمت رو بگو"
            disabled={busy}
            className="mb-10 w-full border-0 border-b border-line/80 bg-transparent px-2 py-3 text-center text-ink outline-none transition placeholder:text-ink-muted focus:border-ink-dim"
            autoComplete="off"
            autoCorrect="off"
          />

          <button
            type="button"
            disabled={busy || name.trim().length < 1}
            onClick={() => void onAwaken(name.trim())}
            className="w-full py-3.5 text-base text-ink transition enabled:active:opacity-70 disabled:opacity-30"
          >
            باز کردن چشم‌ها
          </button>
        </div>
      </div>
    </div>
  );
}
