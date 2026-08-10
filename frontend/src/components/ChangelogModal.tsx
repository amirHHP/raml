import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ChangelogEntry, Language } from '../types/game';
import { t } from '../utils/i18n';

export function ChangelogModal({
  open,
  language = 'fa',
  onClose,
}: {
  open: boolean;
  language?: Language;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.getChangelogs();
        if (!cancelled) setItems(res.items);
      } catch {
        // Silently fail — empty list shown
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium text-ink">
            {t('changelogTitle', language)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-ink-muted transition hover:text-amber"
          >
            {t('close', language)}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[72vh] overflow-y-auto p-4 story-scroll">
          {loading && (
            <div className="py-10 text-center text-xs text-ink-muted">
              {t('loading', language)}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="py-10 text-center text-xs text-ink-muted">
              {t('changelogEmpty', language)}
            </div>
          )}

          {!loading && items.length > 0 && (
            <ul className="space-y-4">
              {items.map((entry, idx) => {
                const title = isEn && entry.titleEn ? entry.titleEn : entry.title;
                const changeItems =
                  isEn && entry.itemsEn?.length ? entry.itemsEn : entry.items;
                const dateStr = isEn
                  ? new Date(entry.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : new Date(entry.createdAt).toLocaleDateString('fa-IR');

                return (
                  <li
                    key={entry.id}
                    className="changelog-card rounded-lg border border-line/60 bg-black/30 p-3"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    {/* Version badge + date */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-amber/30 bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
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
                        v{entry.version}
                      </span>
                      <span className="text-[10px] text-ink-muted">{dateStr}</span>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-medium text-ink mb-2">{title}</h3>

                    {/* Changes list */}
                    <ul className="space-y-1">
                      {changeItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs leading-5 text-ink-dim"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber/60" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
