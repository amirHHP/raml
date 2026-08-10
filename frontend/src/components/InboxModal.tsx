import type { InboxItem, Language } from '../types/game';
import { t } from '../utils/i18n';

export function InboxModal({
  open,
  items,
  language = 'fa',
  onClose,
  onRead,
}: {
  open: boolean;
  items: InboxItem[];
  language?: Language;
  onClose: () => void;
  onRead: (id: string) => void;
}) {
  if (!open) return null;
  const isEn = language === 'en';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium text-ink">{t('inbox', language)}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-ink-muted hover:text-amber"
          >
            {t('close', language)}
          </button>
        </div>
        <ul className="max-h-[65vh] space-y-2 overflow-y-auto p-3">
          {items.length === 0 && (
            <li className="py-8 text-center text-xs text-ink-muted">
              {isEn ? 'No messages' : 'پیامی نیست'}
            </li>
          )}
          {items.map((item) => (
            <li
              key={item.id}
              className={`rounded-lg border px-3 py-2 text-sm ${
                item.readAt
                  ? 'border-line/60 text-ink-dim'
                  : 'border-amber/40 bg-amber/5 text-ink'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{item.title}</p>
                <span className="shrink-0 text-[10px] text-ink-muted">
                  {isEn
                    ? new Date(item.createdAt).toLocaleDateString('en-US')
                    : new Date(item.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
              <p className="mt-1 text-xs leading-6 text-ink-dim">{item.body}</p>
              {!item.readAt && (
                <button
                  type="button"
                  onClick={() => onRead(item.id)}
                  className="mt-2 text-[11px] text-amber underline"
                >
                  {isEn ? 'Mark as read' : 'علامت به‌عنوان خوانده‌شده'}
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
