import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminPlayerSummary } from '../types';
import { CLASS_LABELS } from '../types';

export function PlayersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [items, setItems] = useState<AdminPlayerSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminPlayerSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await adminApi.listPlayers({ q, status, page, limit: 20 });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (
    deviceId: string,
    body: {
      status?: 'active' | 'banned';
      unlockedFullUi?: boolean;
      refillEnergy?: boolean;
    },
  ) => {
    try {
      setBusy(true);
      const res = await adminApi.patchPlayer(deviceId, body);
      setSelected(res.summary);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            placeholder="جستجو نام یا deviceId"
            className="min-w-[12rem] flex-1 rounded-md border border-line bg-sand-2 px-3 py-2 text-sm outline-none focus:border-amber"
          />
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="rounded-md border border-line bg-sand-2 px-3 py-2 text-sm"
          >
            <option value="all">همه</option>
            <option value="active">فعال</option>
            <option value="banned">مسدود</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[40rem] text-right text-sm">
            <thead className="bg-sand-2 text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">نام</th>
                <th className="px-3 py-2 font-medium">کلاس</th>
                <th className="px-3 py-2 font-medium">وضعیت</th>
                <th className="px-3 py-2 font-medium">سطح</th>
                <th className="px-3 py-2 font-medium">آخرین بازی</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.deviceId}
                  onClick={() => setSelected(p)}
                  className={`cursor-pointer border-t border-line hover:bg-sand-2/80 ${
                    selected?.deviceId === p.deviceId ? 'bg-sand-2' : ''
                  }`}
                >
                  <td className="px-3 py-2">{p.characterName || '—'}</td>
                  <td className="px-3 py-2">{CLASS_LABELS[p.classType] || p.classType}</td>
                  <td className="px-3 py-2">
                    <span className={p.status === 'banned' ? 'text-red-400' : 'text-emerald-400'}>
                      {p.status === 'banned' ? 'مسدود' : 'فعال'}
                    </span>
                  </td>
                  <td className="px-3 py-2">{p.level}</td>
                  <td className="px-3 py-2 text-ink-dim">
                    {p.lastPlayedAt
                      ? new Date(p.lastPlayedAt).toLocaleString('fa-IR')
                      : '—'}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-ink-muted">
                    بازیکنی یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-ink-dim">
          <span>
            {total} بازیکن — صفحه {page}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded border border-line px-2 py-1 disabled:opacity-40"
            >
              قبلی
            </button>
            <button
              type="button"
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="rounded border border-line px-2 py-1 disabled:opacity-40"
            >
              بعدی
            </button>
          </div>
        </div>
      </section>

      <aside className="rounded-xl border border-line bg-sand/70 p-4">
        {!selected ? (
          <p className="text-sm text-ink-muted">یک بازیکن را انتخاب کنید</p>
        ) : (
          <div className="space-y-3 text-sm">
            <h2 className="text-lg font-medium">{selected.characterName || 'بدون نام'}</h2>
            <p className="break-all text-ink-dim">{selected.deviceId}</p>
            <dl className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-ink-muted">کلاس</dt>
                <dd>{CLASS_LABELS[selected.classType] || selected.classType}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">وضعیت</dt>
                <dd>{selected.status === 'banned' ? 'مسدود' : 'فعال'}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">سطح / طلا</dt>
                <dd>
                  {selected.level} / {selected.gold}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">انرژی</dt>
                <dd>{selected.energy}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">روز بازی</dt>
                <dd>{selected.playDayCount}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">رابط کامل</dt>
                <dd>{selected.unlockedFullUi ? 'بله' : 'خیر'}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void act(selected.deviceId, {
                    status: selected.status === 'banned' ? 'active' : 'banned',
                  })
                }
                className="rounded-md border border-line px-3 py-1.5 hover:border-amber"
              >
                {selected.status === 'banned' ? 'رفع مسدودیت' : 'مسدود کردن'}
              </button>
              <button
                type="button"
                disabled={busy || selected.unlockedFullUi}
                onClick={() => void act(selected.deviceId, { unlockedFullUi: true })}
                className="rounded-md border border-line px-3 py-1.5 hover:border-amber disabled:opacity-40"
              >
                آنلاک UI
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void act(selected.deviceId, { refillEnergy: true })}
                className="rounded-md border border-line px-3 py-1.5 hover:border-amber"
              >
                پر کردن انرژی
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
