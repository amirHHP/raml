import { useState } from 'react';
import { useWordTypewriter } from '../hooks/useWordTypewriter';
import { DEFAULT_STORY_MS_PER_WORD } from '../utils/storyPacing';
import { tapFeedback } from '../utils/haptics';
import { track } from '../analytics/funnel';
import { t } from '../utils/i18n';
import type { Language } from '../types/game';

export function AwakenScreen({
  storyText,
  busy,
  storyMsPerWord = DEFAULT_STORY_MS_PER_WORD,
  language = 'fa',
  onSetLanguage,
  onAwaken,
  onRestore,
}: {
  storyText: string;
  busy: boolean;
  storyMsPerWord?: number;
  language?: Language;
  onSetLanguage?: (lang: Language) => void;
  onAwaken: (name: string, classType?: any) => Promise<void>;
  onRestore: (saveCode: string) => Promise<boolean>;
}) {
  const [name, setName] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoring, setRestoring] = useState(false);

  const isEn = language === 'en';

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
      {/* Top Language Toggle */}
      {onSetLanguage && (
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-line p-0.5 bg-black/40">
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onSetLanguage('fa');
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                !isEn ? 'bg-amber/20 text-amber' : 'text-ink-muted hover:text-ink'
              }`}
            >
              فارسی
            </button>
            <button
              type="button"
              onClick={() => {
                tapFeedback();
                onSetLanguage('en');
              }}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                isEn ? 'bg-amber/20 text-amber' : 'text-ink-muted hover:text-ink'
              }`}
            >
              English
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
        <button
          type="button"
          onClick={() => {
            if (!done) track('intro_skipped');
            skip();
          }}
          className="mb-10 w-full text-center"
          aria-label={isEn ? 'Opening story — tap to display fully' : 'متن آغازین — برای نمایش کامل لمس کنید'}
        >
          <p className="whitespace-pre-wrap text-[15px] leading-8 text-ink-dim">
            {displayed}
            {!done && (
              <span className="mx-0.5 inline-block w-1.5 animate-pulse bg-ink-muted align-middle">
                {' '}
              </span>
            )}
          </p>
          <span
            className={`mt-4 block text-[11px] text-ink-muted transition-opacity duration-500 ${
              done ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {isEn ? 'Tap to skip' : 'برای رد کردن، لمس کن'}
          </span>
        </button>

        <div className="fade-in-soft flex flex-col items-stretch">
          <input
            id="char-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => track('name_focused')}
            maxLength={24}
            placeholder={t('namePlaceholder', language)}
            disabled={busy}
            className="mb-10 w-full border-0 border-b border-line/80 bg-transparent px-2 py-3 text-center text-ink outline-none transition placeholder:text-ink-muted focus:border-ink-dim"
            autoComplete="off"
            autoCorrect="off"
          />

          <button
            type="button"
            disabled={busy || name.trim().length < 1}
            onClick={() => {
              tapFeedback();
              track('awaken_submitted');
              void onAwaken(name.trim());
            }}
            className="w-full py-3.5 text-base text-ink transition enabled:active:opacity-70 disabled:opacity-30 border border-amber/40 rounded-lg hover:border-amber bg-amber/10"
          >
            {t('openEyesButton', language)}
          </button>

          <button
            type="button"
            disabled={busy || restoring}
            onClick={() => setRestoreOpen((v) => !v)}
            className="mt-6 w-full py-2 text-xs text-ink-muted transition enabled:active:opacity-70"
          >
            {restoreOpen
              ? (isEn ? 'Close Save Code Restore' : 'بستن ورود با کد')
              : t('restoreSaveCode', language)}
          </button>

          {restoreOpen && (
            <div className={`mt-3 space-y-2 ${isEn ? 'text-left' : 'text-right'}`}>
              <p className="text-xs leading-6 text-ink-muted">
                {t('restoreModalHint', language)}
              </p>
              <input
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value)}
                placeholder={t('restoreInputPlaceholder', language)}
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
                {restoring ? (isEn ? 'Loading...' : 'در حال بارگذاری...') : t('restoreButton', language)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
