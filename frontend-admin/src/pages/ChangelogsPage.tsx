import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { ChangelogItem } from '../types';

export function ChangelogsPage() {
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [itemsText, setItemsText] = useState('');
  const [itemsEnText, setItemsEnText] = useState('');
  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await adminApi.listChangelogs();
    setChangelogs(res.items);
  };

  useEffect(() => {
    void load().catch((e: Error) => setError(e.message));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const items = itemsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const itemsEn = itemsEnText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (items.length === 0) {
      setError('حداقل یک مورد تغییرات (فارسی) وارد کنید');
      setBusy(false);
      return;
    }

    try {
      await adminApi.createChangelog({
        version: version.trim(),
        title: title.trim(),
        titleEn: titleEn.trim() || undefined,
        items,
        itemsEn: itemsEn.length > 0 ? itemsEn : undefined,
      });

      setVersion('');
      setTitle('');
      setTitleEn('');
      setItemsText('');
      setItemsEnText('');
      setMessage('تغییرات با موفقیت ثبت شد');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('آیا از حذف این changelog اطمینان دارید؟')) return;
    setBusy(true);
    setError(null);
    try {
      await adminApi.deleteChangelog(id);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSync = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await adminApi.syncChangelogs();
      setMessage(
        res.count > 0
          ? `${res.count} تغییر جدید از گیت‌هاب سینک شد`
          : 'همه تغییرات گیت‌هاب قبل‌تر سینک شده بودند',
      );
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Create form */}
      <form
        onSubmit={(e) => void handleCreate(e)}
        className="space-y-4 rounded-xl border border-line bg-sand/70 p-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">افزودن تغییرات جدید (Changelog)</h2>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-md border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber hover:bg-amber/20 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            همگام‌سازی از گیت‌هاب
          </button>
        </div>

        <label className="block text-sm text-ink-dim">
          نسخه (Version)
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="مثلاً 1.3.0"
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
            required
          />
        </label>

        <label className="block text-sm text-ink-dim">
          عنوان (فارسی)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثلاً آپدیت سیستم خانه و تمرین"
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
            required
          />
        </label>

        <label className="block text-sm text-ink-dim">
          عنوان (English - اختیاری)
          <input
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            placeholder="e.g. Home & Training Update"
            dir="ltr"
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
          />
        </label>

        <label className="block text-sm text-ink-dim">
          لیست تغییرات فارسی (هر مورد در یک خط)
          <textarea
            value={itemsText}
            onChange={(e) => setItemsText(e.target.value)}
            rows={5}
            placeholder="افزوده شدن فعالیت‌های تمرینی&#10;بهبود سرعت انیمیشن‌ها&#10;رفع باگ‌های گزارش شده"
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
            required
          />
        </label>

        <label className="block text-sm text-ink-dim">
          لیست تغییرات انگلیسی (English - اختیاری - هر مورد در یک خط)
          <textarea
            value={itemsEnText}
            onChange={(e) => setItemsEnText(e.target.value)}
            rows={5}
            dir="ltr"
            placeholder="Added daily training activities&#10;Improved animation speeds&#10;Fixed reported bugs"
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
        >
          {busy ? 'در حال ثبت...' : 'ثبت تغییرات'}
        </button>
      </form>

      {/* History list */}
      <section className="rounded-xl border border-line bg-sand/70 p-5">
        <h2 className="text-lg font-medium">تاریخچه تغییرات ثبت‌شده</h2>
        <ul className="mt-4 space-y-4">
          {changelogs.map((cl) => (
            <li
              key={cl.id}
              className="rounded-md border border-line bg-sand-2 p-4 text-sm"
            >
              <div className="flex items-center justify-between gap-3 border-b border-line/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber/20 px-2 py-0.5 font-mono text-xs font-semibold text-amber">
                    v{cl.version}
                  </span>
                  <p className="font-medium text-ink">{cl.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDelete(cl.id)}
                  disabled={busy}
                  className="text-xs text-red-400 hover:underline disabled:opacity-50"
                >
                  حذف
                </button>
              </div>

              {cl.titleEn && (
                <p className="mt-1 font-sans text-xs text-ink-muted dir-ltr text-left">
                  {cl.titleEn}
                </p>
              )}

              <div className="mt-3 space-y-1 text-xs text-ink-dim">
                <p className="font-semibold text-ink-muted">تغییرات فارسی:</p>
                <ul className="list-inside list-disc space-y-0.5 pr-2">
                  {cl.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              {cl.itemsEn && cl.itemsEn.length > 0 && (
                <div className="mt-3 space-y-1 text-xs text-ink-dim dir-ltr text-left">
                  <p className="font-semibold text-ink-muted">English changes:</p>
                  <ul className="list-inside list-disc space-y-0.5 pl-2">
                    {cl.itemsEn.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mt-3 text-[11px] text-ink-muted text-left dir-ltr">
                {new Date(cl.createdAt).toLocaleString('fa-IR')}
              </p>
            </li>
          ))}

          {changelogs.length === 0 && (
            <li className="text-sm text-ink-muted">هنوز هیچ changelog ای ثبت نشده است.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
