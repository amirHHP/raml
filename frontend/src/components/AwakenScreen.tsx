import { useState } from 'react';
import { useWordTypewriter } from '../hooks/useWordTypewriter';

const DEFAULT_STORY_MS_PER_WORD = 400;

export function AwakenScreen({
  storyText,
  busy,
  storyMsPerWord = DEFAULT_STORY_MS_PER_WORD,
  onAwaken,
  onRestore,
}: {
  storyText: string;
  busy: boolean;
  storyMsPerWord?: number;
  onAwaken: (name: string) => Promise<void>;
  onRestore: (saveCode: string) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoring, setRestoring] = useState(false);

  // Keep only the first atmospheric block (older saves may still have a second paragraph).
  const intro = storyText.split(/\n\n/)[0]?.trim() || storyText.trim();
  const { displayed, done, skip } = useWordTypewriter(
    intro,
    storyMsPerWord || DEFAULT_STORY_MS_PER_WORD,
  );

  const handleRestore = async () => {
    const code = restoreCode.trim();
    if (code.length < 8 || restoring || busy) return;
    setRestoring(true);
    try {
      const ok = await onRestore(code);
      if (ok) setRestoreCode('');
    } finally {
      setRestoring(false);
    }
  };

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

          <button
            type="button"
            disabled={busy || restoring}
            onClick={() => setRestoreOpen((v) => !v)}
            className="mt-6 w-full py-2 text-xs text-ink-muted transition enabled:active:opacity-70"
          >
            {restoreOpen ? 'بستن ورود با کد' : 'کد ذخیره دارم'}
          </button>

          {restoreOpen && (
            <div className="mt-3 space-y-2 text-right">
              <p className="text-xs leading-6 text-ink-muted">
                اگر قبلاً بازی کرده‌ای و کد ذخیره‌ات را داری، اینجا وارد کن تا همان پیشرفت لود
                شود.
              </p>
              <input
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
                placeholder="کد ذخیره"
                disabled={busy || restoring}
                dir="ltr"
                className="w-full border-0 border-b border-line/80 bg-transparent px-2 py-3 text-left font-mono text-xs text-ink outline-none focus:border-ink-dim"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                disabled={busy || restoring || restoreCode.trim().length < 8}
                onClick={() => void handleRestore()}
                className="w-full py-3 text-sm text-amber transition enabled:active:opacity-70 disabled:opacity-30"
              >
                {restoring ? 'در حال بارگذاری...' : 'بارگذاری بازی'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
