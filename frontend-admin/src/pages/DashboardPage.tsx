import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { AdminStats, FunnelReport, ReferralAdminStats } from '../types';
import { CLASS_LABELS, FUNNEL_LABELS } from '../types';

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-sand/70 p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function seconds(ms: number | null): string {
  if (ms == null) return '—';
  return `${(ms / 1000).toFixed(1)} ثانیه`;
}

/** Ordered drop-off across the first minute, plus how long that minute takes. */
function FunnelSection({ report }: { report: FunnelReport }) {
  const total = report.steps[0]?.sessions ?? 0;

  if (total === 0) {
    return (
      <section className="rounded-xl border border-line bg-sand/70 p-4">
        <h2 className="text-sm font-medium text-ink-dim">قیف انگیجمنت اولیه</h2>
        <p className="mt-3 text-sm text-ink-muted">
          هنوز رویدادی ثبت نشده. قیف فقط برای بازیکن‌هایی ثبت می‌شود که برای اولین بار
          بازی را باز می‌کنند.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-line bg-sand/70 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-ink-dim">قیف انگیجمنت اولیه</h2>
        <p className="text-xs text-ink-muted">
          زمان تا اولین انتخاب — میانه {seconds(report.timeToFirstChoiceMs.median)} / نود‌ک{' '}
          {seconds(report.timeToFirstChoiceMs.p90)} (
          {report.timeToFirstChoiceMs.samples} نمونه)
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {report.steps.map((step) => (
          <div key={step.name} className="rounded-md bg-sand-2 px-3 py-2">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{FUNNEL_LABELS[step.name] || step.name}</span>
              <span className="shrink-0 text-xs text-ink-muted">
                {step.sessions} نفر — {step.reachedPct}%
                {step.dropPct > 0 && (
                  <span className="text-red-400"> (ریزش {step.dropPct}%)</span>
                )}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-amber"
                style={{ width: `${step.reachedPct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <h3 className="mt-5 text-xs font-medium text-ink-dim">
        رد کردن انیمیشن‌ها (نشانهٔ کند بودن)
      </h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {report.signals.map((signal) => (
          <div
            key={signal.name}
            className="flex items-center justify-between rounded-md bg-sand-2 px-3 py-2 text-sm"
          >
            <span>{FUNNEL_LABELS[signal.name] || signal.name}</span>
            <span className="text-amber">
              {total > 0 ? Math.round((signal.sessions / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReferralSection({ stats }: { stats: ReferralAdminStats }) {
  return (
    <section className="space-y-4 rounded-xl border border-line bg-sand/70 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-medium text-ink-dim">آمار سیستم دعوت از دوستان (ریفرال)</h2>
        <span className="text-xs text-amber">
          پاداش: {stats.referrerGoldReward} طلا (دعوت‌کننده) / {stats.refereeGoldReward} طلا (دعوت‌شده)
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-sand-2 p-3">
          <p className="text-xs text-ink-muted">بازیکنان واردشده با کد</p>
          <p className="mt-1 text-xl font-semibold text-amber">{stats.totalReferredPlayers}</p>
        </div>
        <div className="rounded-lg bg-sand-2 p-3">
          <p className="text-xs text-ink-muted">دعوت‌های موفق تکمیل‌شده</p>
          <p className="mt-1 text-xl font-semibold text-amber">{stats.totalReferralsCompleted}</p>
        </div>
        <div className="rounded-lg bg-sand-2 p-3">
          <p className="text-xs text-ink-muted">طلا اعطا شده به دعوت‌کنندگان</p>
          <p className="mt-1 text-xl font-semibold text-amber">{stats.totalReferrerGoldGranted.toLocaleString('fa-IR')}</p>
        </div>
        <div className="rounded-lg bg-sand-2 p-3">
          <p className="text-xs text-ink-muted">طلا اعطا شده به دعوت‌شدگان</p>
          <p className="mt-1 text-xl font-semibold text-amber">{stats.totalRefereeGoldGranted.toLocaleString('fa-IR')}</p>
        </div>
      </div>

      {stats.topReferrers.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <h3 className="text-xs font-medium text-ink-dim mb-2">برترین دعوت‌کنندگان</h3>
          <div className="space-y-1.5">
            {stats.topReferrers.map((r, i) => (
              <div key={r.deviceId} className="flex items-center justify-between rounded-md bg-sand-2 px-3 py-1.5 text-xs">
                <span className="font-medium text-ink">
                  {i + 1}. {r.characterName}
                </span>
                <span className="font-mono text-amber">
                  {r.referralCount} دعوت موفق
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [funnel, setFunnel] = useState<FunnelReport | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralAdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      adminApi.getStats(),
      adminApi.getFunnel(),
      adminApi.getReferralStats().catch(() => null),
    ])
      .then(([s, f, r]) => {
        if (cancelled) return;
        setStats(s);
        setFunnel(f);
        setReferralStats(r);
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

      {referralStats && <ReferralSection stats={referralStats} />}

      {funnel && <FunnelSection report={funnel} />}

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
