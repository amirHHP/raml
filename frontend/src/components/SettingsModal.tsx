export function SettingsModal({
  open,
  onClose,
  onUnlock,
  busy,
  playDayCount,
  unlocked,
}: {
  open: boolean;
  onClose: () => void;
  onUnlock: () => void;
  busy: boolean;
  playDayCount: number;
  unlocked: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-line bg-panel p-5 sm:rounded-2xl">
        <h3 className="text-base text-ink">تنظیمات</h3>
        <ul className="mt-4 space-y-3 text-sm text-ink-dim">
          <li>زبان: فارسی</li>
          <li>روزهای بازی: {playDayCount}</li>
          <li>رابط کامل: {unlocked ? 'فعال' : 'قفل (پس از ۳ روز)'}</li>
          <li className="text-xs text-ink-muted">
            انرژی هر ۲۰ دقیقه یک واحد بازسازی می‌شود.
          </li>
        </ul>
        <button
          type="button"
          disabled={busy || unlocked}
          onClick={onUnlock}
          className="mt-5 w-full rounded-lg border border-amber/40 py-2.5 text-sm text-amber disabled:opacity-40"
        >
          {unlocked ? 'رابط کامل فعال است' : 'آنلاک آزمایشی (دیباگ)'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-lg border border-line py-2.5 text-sm text-ink-dim"
        >
          بستن
        </button>
      </div>
    </div>
  );
}
