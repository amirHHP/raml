import { useState } from 'react';
import { getDeviceId } from '../api/client';
import type { Language } from '../types/game';
import { t } from '../utils/i18n';

export function SettingsModal({
  open,
  language = 'fa',
  onSetLanguage,
  onClose,
  onUnlock,
  busy,
  playDayCount,
  unlocked,
}: {
  open: boolean;
  language?: Language;
  onSetLanguage?: (lang: Language) => void;
  onClose: () => void;
  onUnlock: () => void;
  busy: boolean;
  playDayCount: number;
  unlocked: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const isEn = language === 'en';
  const deviceId = getDeviceId();

  const handleCopyCode = () => {
    void navigator.clipboard?.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-line bg-panel p-5 sm:rounded-2xl">
        <h3 className="text-base text-ink font-medium">{t('settingsTitle', language)}</h3>

        {/* Language Selection */}
        <div className="mt-4 rounded-xl border border-line/60 bg-black/30 p-3">
          <label className="block text-xs text-ink-muted mb-2 font-medium">
            {t('gameLanguageLabel', language)}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetLanguage?.('fa')}
              className={`py-2 px-3 text-xs rounded-lg border font-medium transition ${
                !isEn
                  ? 'border-amber bg-amber/20 text-amber'
                  : 'border-line bg-black/40 text-ink-muted hover:text-ink'
              }`}
            >
              فارسی (Persian)
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onSetLanguage?.('en')}
              className={`py-2 px-3 text-xs rounded-lg border font-medium transition ${
                isEn
                  ? 'border-amber bg-amber/20 text-amber'
                  : 'border-line bg-black/40 text-ink-muted hover:text-ink'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Save Code / Device ID */}
        <div className="mt-3 rounded-xl border border-line/60 bg-black/30 p-3">
          <label className="block text-xs text-ink-muted mb-1 font-medium">
            {t('saveCodeLabel', language)}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={deviceId}
              className="flex-1 bg-black/50 border border-line/50 rounded-lg px-2.5 py-1.5 font-mono text-xs text-ink-dim outline-none"
            />
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 text-xs text-amber border border-amber/40 rounded-lg hover:border-amber bg-amber/10 transition"
            >
              {copied ? t('copied', language) : t('copy', language)}
            </button>
          </div>
        </div>

        <ul className="mt-4 space-y-2.5 text-xs text-ink-dim px-1">
          <li className="flex justify-between">
            <span className="text-ink-muted">{t('playDayCountLabel', language)}</span>
            <span className="text-ink">{playDayCount}</span>
          </li>
          <li className="flex justify-between">
            <span className="text-ink-muted">{isEn ? 'Full UI Status:' : 'رابط کامل:'}</span>
            <span className="text-ink">
              {unlocked
                ? (isEn ? 'Active' : 'فعال')
                : (isEn ? 'Locked (after 3 days)' : 'قفل (پس از ۳ روز)')}
            </span>
          </li>
        </ul>

        <button
          type="button"
          disabled={busy || unlocked}
          onClick={onUnlock}
          className="mt-5 w-full rounded-lg border border-amber/40 py-2.5 text-sm text-amber disabled:opacity-40"
        >
          {unlocked
            ? t('fullUiUnlockedMsg', language)
            : t('unlockFullUiButton', language)}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-lg border border-line py-2.5 text-sm text-ink-dim"
        >
          {t('close', language)}
        </button>
      </div>
    </div>
  );
}
