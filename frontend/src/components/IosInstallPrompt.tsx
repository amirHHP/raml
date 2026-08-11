import { useEffect, useState } from 'react';
import type { Language } from '../types/game';
import { t } from '../utils/i18n';

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isTouchMac =
    Boolean(window.navigator.maxTouchPoints && window.navigator.maxTouchPoints > 2) &&
    /Macintosh/.test(ua);
  return /iPhone|iPad|iPod/.test(ua) || isTouchMac;
}

export function isStandaloneApp(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as unknown as { standalone?: boolean };
  const isStandaloneNavigator = nav.standalone === true;
  const isDisplayModeStandalone = window.matchMedia(
    '(display-mode: standalone)'
  ).matches;
  return isStandaloneNavigator || isDisplayModeStandalone;
}

interface IosInstallPromptProps {
  open?: boolean;
  language?: Language;
  onClose?: () => void;
  forceShow?: boolean;
}

const STORAGE_KEY = 'raml_ios_pwa_prompt_dismissed';

export function IosInstallPrompt({
  open: controlledOpen,
  language = 'fa',
  onClose,
  forceShow = false,
}: IosInstallPromptProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (controlledOpen !== undefined) {
      setIsOpen(controlledOpen);
      return;
    }

    // Auto-detect on mount
    const isIos = isIOSDevice();
    const isStandalone = isStandaloneApp();
    const dismissed = localStorage.getItem(STORAGE_KEY) === '1';

    if ((isIos || forceShow) && !isStandalone && !dismissed) {
      setIsOpen(true);
    }
  }, [controlledOpen, forceShow]);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setIsOpen(false);
    onClose?.();
  };

  const handleCloseOnly = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  const isEn = language === 'en';

  return (
    <div
      dir={isEn ? 'ltr' : 'rtl'}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center animate-fadeIn"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-amber/30 bg-panel shadow-2xl transition-all">
        {/* Top glow bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber/20 via-amber to-amber/20" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192.png"
              alt="App Icon"
              className="h-10 w-10 rounded-xl border border-amber/40 shadow-md"
            />
            <div>
              <h2 className="text-sm font-semibold text-ink">
                {t('iosInstallTitle', language)}
              </h2>
              <span className="text-[11px] text-amber">WebApp / PWA</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseOnly}
            className="rounded-lg p-1 text-ink-muted transition hover:bg-white/5 hover:text-ink"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4 p-5 text-xs">
          <p className="leading-relaxed text-ink-dim">
            {t('iosInstallSubtitle', language)}
          </p>

          {/* Steps */}
          <div className="space-y-3 rounded-xl border border-amber/20 bg-black/40 p-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber/40 bg-amber/10 text-amber shadow-sm">
                {/* Safari Share Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-bounce"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink">
                  {t('iosInstallStep1Title', language)}
                </h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {t('iosInstallStep1Desc', language)}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-line/60" />

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber/40 bg-amber/10 text-amber shadow-sm">
                {/* Add to home screen icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink">
                  {t('iosInstallStep2Title', language)}
                </h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {t('iosInstallStep2Desc', language)}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-line/60" />

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber/40 bg-amber/10 text-amber shadow-sm">
                {/* Checkmark icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-ink">
                  {t('iosInstallStep3Title', language)}
                </h3>
                <p className="mt-0.5 text-[11px] leading-relaxed text-ink-muted">
                  {t('iosInstallStep3Desc', language)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-line bg-black/30 px-5 py-4">
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full rounded-xl border border-amber/60 bg-amber/15 py-2.5 font-medium text-amber transition hover:bg-amber/25 active:scale-[0.99]"
          >
            {t('iosInstallDismiss', language)}
          </button>
        </div>
      </div>
    </div>
  );
}
