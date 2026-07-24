import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminStats } from '../types';
import { CLASS_LABELS } from '../types';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-sand/70 p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!stats) return <p className="text-ink-dim">در حال بارگذاری آمار...</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="کل بازیکن‌ها" value={stats.totalPlayers} />
        <StatCard label="بیدار شده" value={stats.awakened} />
        <StatCard label="فعال روزانه (۲۴س)" value={stats.dau} />
        <StatCard label="فعال هفتگی" value={stats.wau} />
        <StatCard label="رابط کامل" value={stats.unlocked} />
        <StatCard label="مسدود" value={stats.banned} />
        <StatCard label="دارای خرید" value={stats.withPurchases} />
        <StatCard label="حالت حافظه" value={stats.memoryStore ? 'بله' : 'خیر'} />
      </div>

      <section className="rounded-xl border border-line bg-sand/70 p-4">
        <h2 className="text-sm font-medium text-ink-dim">توزیع کلاس</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(stats.classBreakdown).map(([key, count]) => (
            <div key={key} className="flex items-center justify-between rounded-md bg-sand-2 px-3 py-2">
              <span>{CLASS_LABELS[key] || key}</span>
              <span className="text-amber">{count}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
