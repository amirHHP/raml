import { useState } from 'react';
import { getDeviceId } from '../api/client';
import type { AudioSettings } from '../utils/audioEngine';
import type { Language } from '../types/game';
import { t } from '../utils/i18n';
import { IconMusic, IconVolumeHigh, IconVolumeMute } from './icons';

export function SettingsModal({
  open,
  language = 'fa',
  onSetLanguage,
  onClose,
  onUnlock,
  onChangelog,
  onFeedback,
  onOpenIosInstall,
  busy,
  playDayCount,
  unlocked,
  audioSettings,
  onToggleBgm,
  onToggleSfx,
  onSetBgmVolume,
  onSetSfxVolume,
}: {
  open: boolean;
  language?: Language;
  onSetLanguage?: (lang: Language) => void;
  onClose: () => void;
  onUnlock: () => void;
  onChangelog?: () => void;
  onFeedback?: () => void;
  onOpenIosInstall?: () => void;
  busy: boolean;
  playDayCount: number;
  unlocked: boolean;
  audioSettings?: AudioSettings;
  onToggleBgm?: () => void;
  onToggleSfx?: () => void;
  onSetBgmVolume?: (vol: number) => void;
  onSetSfxVolume?: (vol: number) => void;
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
      <div className="w-full max-w-md rounded-t-2xl border border-line bg-panel p-5 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-base text-ink font-medium">{t('settingsTitle', language)}</h3>

        {/* Audio & Music Settings Section */}
        {audioSettings && (
          <div className="mt-4 rounded-xl border border-amber/30 bg-amber/5 p-3.5 space-y-3">
            <h4 className="text-xs font-medium text-amber flex items-center gap-1.5">
              <IconMusic size={16} />
              {t('audioSettingsTitle', language)}
            </h4>

            {/* BGM Toggle & Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-dim font-medium">{t('bgmLabel', language)}</span>
                <button
                  type="button"
                  onClick={onToggleBgm}
                  className={`px-3 py-1 text-[11px] rounded-lg border font-medium transition ${
                    audioSettings.bgmEnabled
                      ? 'border-amber bg-amber/20 text-amber'
                      : 'border-line bg-black/40 text-ink-muted'
                  }`}
                >
                  {audioSettings.bgmEnabled ? t('audioOn', language) : t('audioOff', language)}
                </button>
              </div>
              {audioSettings.bgmEnabled && (
                <div className="flex items-center gap-2 pt-1">
                  <IconVolumeMute size={14} className="text-ink-muted" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioSettings.bgmVolume}
                    onChange={(e) => onSetBgmVolume?.(parseFloat(e.target.value))}
                    className="flex-1 accent-amber h-1.5 rounded-lg bg-black/50 cursor-pointer"
                  />
                  <IconVolumeHigh size={14} className="text-amber" />
                </div>
              )}
            </div>

            {/* SFX Toggle & Volume */}
            <div className="space-y-1.5 pt-1 border-t border-line/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-dim font-medium">{t('sfxLabel', language)}</span>
                <button
                  type="button"
                  onClick={onToggleSfx}
                  className={`px-3 py-1 text-[11px] rounded-lg border font-medium transition ${
                    audioSettings.sfxEnabled
                      ? 'border-amber bg-amber/20 text-amber'
                      : 'border-line bg-black/40 text-ink-muted'
                  }`}
                >
                  {audioSettings.sfxEnabled ? t('audioOn', language) : t('audioOff', language)}
                </button>
              </div>
              {audioSettings.sfxEnabled && (
                <div className="flex items-center gap-2 pt-1">
                  <IconVolumeMute size={14} className="text-ink-muted" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioSettings.sfxVolume}
                    onChange={(e) => onSetSfxVolume?.(parseFloat(e.target.value))}
                    className="flex-1 accent-amber h-1.5 rounded-lg bg-black/50 cursor-pointer"
                  />
                  <IconVolumeHigh size={14} className="text-amber" />
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* PWA / WebApp Install Guide Button */}
        {onOpenIosInstall && (
          <button
            type="button"
            onClick={onOpenIosInstall}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-amber/40 bg-amber/10 py-2.5 text-sm font-medium text-amber transition hover:bg-amber/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" ry="3" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            {t('installPwaButton', language)}
          </button>
        )}

        {onChangelog && (
          <button
            type="button"
            onClick={onChangelog}
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg border border-line/70 bg-black/30 py-2.5 text-sm text-ink-dim transition hover:border-amber/40 hover:text-amber"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 8v4l3 3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
            {t('changelogButton', language)}
          </button>
        )}

        {onFeedback && (
          <button
            type="button"
            onClick={onFeedback}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-line/70 bg-black/30 py-2.5 text-sm text-ink-dim transition hover:border-amber/40 hover:text-amber"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {t('feedbackTitle', language)}
          </button>
        )}

        <button
          type="button"
          disabled={busy || unlocked}
          onClick={onUnlock}
          className="mt-3 w-full rounded-lg border border-amber/40 py-2.5 text-sm text-amber disabled:opacity-40"
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

