import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Language, ReferralInfo } from '../../types/game';
import { t } from '../../utils/i18n';
import { IconUser, IconCoin } from '../icons';

export function ReferralPanel({
  language = 'fa',
  referralCode,
}: {
  language?: Language;
  referralCode: string;
}) {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMsg, setApplyMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isEn = language === 'en';

  const fetchInfo = async () => {
    try {
      const res = await api.getReferralInfo();
      setInfo(res);
    } catch {
      // Fallback if loading fails
    }
  };

  useEffect(() => {
    void fetchInfo();
  }, []);

  const activeCode = info?.referralCode || referralCode;

  const copyCode = async () => {
    if (!activeCode) return;
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(isEn ? 'Copy invite code:' : 'کد دعوت را کپی کنید:', activeCode);
    }
  };

  const shareCode = async () => {
    if (!activeCode) return;
    const text = t('referralShareText', language).replace('{code}', activeCode);
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('appName', language),
          text,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      await copyCode();
    }
  };

  const handleApply = async () => {
    const code = inputCode.trim();
    if (!code || applying) return;
    setApplying(true);
    setApplyMsg(null);
    try {
      const res = await api.applyReferral(code);
      setApplyMsg({
        type: 'success',
        text: isEn
          ? `Invite code applied! Referrer: ${res.referrerName}`
          : `کد دعوت ثبت شد! دعوت‌کننده: ${res.referrerName}`,
      });
      setInputCode('');
      await fetchInfo();
    } catch (e) {
      setApplyMsg({
        type: 'error',
        text: (e as Error).message || (isEn ? 'Failed to apply code' : 'خطا در ثبت کد'),
      });
    } finally {
      setApplying(false);
    }
  };

  const count = info?.referralCount ?? 0;
  const max = info?.maxReferrals ?? 20;
  const progressPct = Math.min(100, Math.round((count / max) * 100));

  return (
    <div className="space-y-4 rounded-xl border border-amber/30 bg-panel p-4 text-ink">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line pb-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber/50 bg-amber/10 text-amber">
          <IconUser size={22} />
        </div>
        <div>
          <h3 className="font-display text-base font-bold text-amber-glow">
            {t('referralTitle', language)}
          </h3>
          <p className="text-xs text-ink-muted">
            {t('referralSubtitle', language)}
          </p>
        </div>
      </div>

      {/* Reward Rules Highlight */}
      <div className="flex items-center gap-2 rounded-lg border border-amber/20 bg-amber/5 px-3 py-2 text-xs text-amber">
        <IconCoin size={18} className="shrink-0" />
        <span>{t('referralRewardNote', language)}</span>
      </div>

      {/* Referrer's Code Card */}
      <div className="rounded-lg border border-line bg-oled p-3">
        <p className="text-xs text-ink-muted">{t('referralCodeLabel', language)}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-lg font-bold tracking-widest text-amber-glow">
            {activeCode || '------'}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void copyCode()}
              className="rounded-md border border-amber/50 px-3 py-1 text-xs text-amber transition hover:bg-amber/10"
            >
              {copied ? t('copied', language) : t('referralCopyCode', language)}
            </button>
            <button
              type="button"
              onClick={() => void shareCode()}
              className="rounded-md border border-line bg-panel px-3 py-1 text-xs text-ink-dim transition hover:text-ink"
            >
              {t('referralShare', language)}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex justify-between text-xs text-ink-muted">
          <span>{t('referralProgress', language)}</span>
          <span className="font-mono text-amber">
            {count} / {max}
          </span>
        </div>
        <div className="souls-bar mt-1.5 rounded-full">
          <div
            className="souls-bar-fill souls-bar-xp rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Apply Code Input (if not already referred) */}
      {info && !info.referredBy && (
        <div className="space-y-2 border-t border-line pt-3">
          <p className="text-xs text-ink-muted">{t('referralEnterCode', language)}</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="EX: ABC123"
              maxLength={12}
              dir="ltr"
              className="w-full rounded-lg border border-line bg-oled px-3 py-1.5 font-mono text-sm text-ink outline-none focus:border-amber/50"
            />
            <button
              type="button"
              disabled={applying || !inputCode.trim()}
              onClick={() => void handleApply()}
              className="shrink-0 rounded-lg border border-amber/50 px-4 py-1.5 text-xs text-amber transition hover:bg-amber/10 disabled:opacity-40"
            >
              {applying ? (isEn ? '...' : 'در حال ثبت...') : t('referralApply', language)}
            </button>
          </div>
          {applyMsg && (
            <p
              className={`text-xs ${
                applyMsg.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {applyMsg.text}
            </p>
          )}
        </div>
      )}

      {/* Invited Friends List */}
      {info && (
        <div className="border-t border-line pt-3">
          <p className="text-xs text-ink-muted mb-2">{t('referralFriendsTitle', language)}</p>
          {info.referredFriends.length === 0 ? (
            <p className="text-xs text-ink-muted/70 italic">
              {t('referralNoFriends', language)}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {info.referredFriends.map((name, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 rounded-md border border-line bg-oled px-2.5 py-1 text-xs text-ink-dim"
                >
                  <IconUser size={12} className="text-amber" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
