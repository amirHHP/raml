import { useEffect, useState, type FormEvent } from 'react';
import { adminApi } from '../api';
import type { AdminNotification } from '../types';

export function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'device'>('all');
  const [deviceId, setDeviceId] = useState('');
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await adminApi.listNotifications();
    setItems(res.items);
  };

  useEffect(() => {
    void load().catch((e: Error) => setError(e.message));
  }, []);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await adminApi.sendNotification({
        title: title.trim(),
        body: body.trim(),
        targetType,
        targetDeviceId: targetType === 'device' ? deviceId.trim() : undefined,
      });
      setTitle('');
      setBody('');
      setMessage(
        `ارسال شد${
          result.notification.delivered != null
            ? ` (${result.notification.delivered} گیرنده)`
            : ''
        }`,
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
      <form
        onSubmit={(e) => void send(e)}
        className="space-y-4 rounded-xl border border-line bg-sand/70 p-5"
      >
        <h2 className="text-lg font-medium">ارسال اعلان</h2>
        <label className="block text-sm text-ink-dim">
          عنوان
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
            required
          />
        </label>
        <label className="block text-sm text-ink-dim">
          متن
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
            required
          />
        </label>
        <label className="block text-sm text-ink-dim">
          مخاطب
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as 'all' | 'device')}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2"
          >
            <option value="all">همه بازیکن‌ها</option>
            <option value="device">یک دستگاه</option>
          </select>
        </label>
        {targetType === 'device' && (
          <label className="block text-sm text-ink-dim">
            Device ID
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 outline-none focus:border-amber"
              required
            />
          </label>
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {message && <p className="text-sm text-emerald-400">{message}</p>}
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
        >
          {busy ? 'در حال ارسال...' : 'ارسال'}
        </button>
      </form>

      <section className="rounded-xl border border-line bg-sand/70 p-5">
        <h2 className="text-lg font-medium">تاریخچه</h2>
        <ul className="mt-4 space-y-3">
          {items.map((n) => (
            <li key={n.id} className="rounded-md border border-line bg-sand-2 p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">{n.title}</p>
                <span className="shrink-0 text-xs text-ink-muted">
                  {new Date(n.createdAt).toLocaleString('fa-IR')}
                </span>
              </div>
              <p className="mt-1 text-ink-dim">{n.body}</p>
              <p className="mt-2 text-xs text-amber">
                {n.targetType === 'all' ? 'همه' : `دستگاه: ${n.targetDeviceId}`}
              </p>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-ink-muted">هنوز اعلانی ارسال نشده</li>
          )}
        </ul>
      </section>
    </div>
  );
}
