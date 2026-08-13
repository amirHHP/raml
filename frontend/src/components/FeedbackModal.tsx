import { useState } from 'react';
import type { Language } from '../types/game';
import { t } from '../utils/i18n';
import { api } from '../api/client';

export function FeedbackModal({
  open,
  language = 'fa',
  characterName,
  onClose,
}: {
  open: boolean;
  language?: Language;
  characterName?: string;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<'general' | 'bug' | 'suggestion' | 'praise'>('general');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || message.trim().length < 3) {
      setError(t('feedbackErrorShort', language));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.submitFeedback({
        category,
        rating,
        message: message.trim(),
        characterName: characterName || null,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || t('connectionError', language));
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (!busy) {
      onClose();
      // Reset state after animation
      setTimeout(() => {
        setSuccess(false);
        setMessage('');
        setRating(5);
        setCategory('general');
        setError(null);
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-line bg-panel p-5 sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-base text-ink font-medium mb-4">{t('feedbackTitle', language)}</h3>

        {success ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-amber/20 text-amber flex items-center justify-center mb-4 border border-amber/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <p className="text-sm text-ink mb-6">{t('feedbackSuccess', language)}</p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg border border-line py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-black/20 transition"
            >
              {t('close', language)}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs text-ink-muted mb-2">{t('feedbackCategoryLabel', language)}</label>
              <div className="grid grid-cols-2 gap-2">
                {(['general', 'suggestion', 'bug', 'praise'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 text-xs rounded-lg border font-medium transition ${
                      category === cat
                        ? 'border-amber bg-amber/20 text-amber'
                        : 'border-line bg-black/40 text-ink-muted hover:text-ink'
                    }`}
                  >
                    {t(`feedbackCat_${cat}` as any, language)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-muted mb-2">{t('feedbackRatingLabel', language)}</label>
              <div className="flex justify-center gap-3 py-2 bg-black/30 rounded-xl border border-line/50">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill={rating >= star ? '#F59E0B' : 'transparent'}
                      stroke={rating >= star ? '#F59E0B' : '#52525B'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-ink-muted mb-2">{t('feedbackMessageLabel', language)}</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('feedbackMessagePlaceholder', language)}
                className="w-full bg-black/50 border border-line/50 rounded-lg px-3 py-2 text-sm text-ink placeholder:text-ink-muted/50 outline-none focus:border-amber/50 min-h-[100px] resize-none"
                dir="auto"
                disabled={busy}
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="submit"
                disabled={busy || message.trim().length < 3}
                className="flex-1 rounded-lg border border-amber/40 bg-amber/10 py-2.5 text-sm font-medium text-amber transition hover:bg-amber/20 disabled:opacity-40"
              >
                {busy ? '...' : t('feedbackSubmit', language)}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="px-4 rounded-lg border border-line py-2.5 text-sm text-ink-dim hover:text-ink hover:bg-black/20 transition disabled:opacity-40"
              >
                {t('cancel', language)}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
