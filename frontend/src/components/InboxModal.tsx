import type { InboxItem } from '../types/game';

export function InboxModal({
  open,
  items,
  onClose,
  onRead,
}: {
  open: boolean;
  items: InboxItem[];
  onClose: () => void;
  onRead: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl border border-line bg-panel shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium text-ink">صندوق پیام</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-ink-muted hover:text-amber"
          >
            بستن
          </button>
        </div>
        <ul className="max-h-[65vh] space-y-2 overflow-y-auto p-3">
          {items.length === 0 && (
            <li className="py-8 text-center text-xs text-ink-muted">پیامی نیست</li>
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
                  {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                </span>
              </div>
              <p className="mt-1 text-xs leading-6 text-ink-dim">{item.body}</p>
              {!item.readAt && (
                <button
                  type="button"
                  onClick={() => onRead(item.id)}
                  className="mt-2 text-[11px] text-amber underline"
                >
                  علامت به‌عنوان خوانده‌شده
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
