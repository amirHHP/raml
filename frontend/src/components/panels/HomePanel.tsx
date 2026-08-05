import { useEffect, useState } from 'react';
import type {
  GameState,
  HomeActionResult,
  HomeActivityId,
} from '../../types/game';
import {
  IconCoin,
  IconZap,
} from '../icons';

interface HomePanelProps {
  state: GameState;
  busy: boolean;
  onReturnHome: () => Promise<void>;
  onEnterCave?: () => Promise<void>;
  onStartActivity: (
    activityId: HomeActivityId,
    durationMinutes: number,
  ) => Promise<void>;
  onSpeedUp: () => Promise<void>;
  onCancel: () => Promise<void>;
  onClaim: () => Promise<{ state: GameState; result: HomeActionResult }>;
}

interface ActivityDef {
  id: HomeActivityId;
  title: string;
  subtitle: string;
  icon: string;
  statBonus: string;
  badgeColor: string;
  bgGradient: string;
}

const ACTIVITIES: ActivityDef[] = [
  {
    id: 'sword_training',
    title: 'تمرین شمشیرزنی',
    subtitle: 'مبارزه با مترسک‌های چوبی و تقویت عضلات',
    icon: '⚔️',
    statBonus: 'افزایش قدرت (Strength)',
    badgeColor: 'text-red-400 border-red-500/30 bg-red-950/40',
    bgGradient: 'from-red-950/40 via-oled to-red-900/10 border-red-900/40',
  },
  {
    id: 'obstacle_jump',
    title: 'تمرین پرش از موانع',
    subtitle: 'عبور از صخره‌ها و موانع متحرک',
    icon: '🏃‍♂️',
    statBonus: 'افزایش چابکی (Agility)',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
    bgGradient: 'from-emerald-950/40 via-oled to-emerald-900/10 border-emerald-900/40',
  },
  {
    id: 'meditation',
    title: 'مدیتیشن و مراقبه',
    subtitle: 'تمرکز بر انرژی‌های درونی و آرامش ذهن',
    icon: '🧘',
    statBonus: 'افزایش خرد (Intellect)',
    badgeColor: 'text-sky-400 border-sky-500/30 bg-sky-950/40',
    bgGradient: 'from-sky-950/40 via-oled to-sky-900/10 border-sky-900/40',
  },
  {
    id: 'excavation',
    title: 'حفاری و کاوش زیرزمین',
    subtitle: 'کاویدن لایه‌های کهن برای یافتن گنجینه',
    icon: '⛏️',
    statBonus: 'کشف طلا و آیتم‌های کمیاب',
    badgeColor: 'text-amber border-amber/30 bg-amber-950/40',
    bgGradient: 'from-amber-950/40 via-oled to-amber-900/10 border-amber-900/40',
  },
  {
    id: 'hunting',
    title: 'شکار در جنگل‌های تاریک',
    subtitle: 'ردیابی صیدها برای بازگشت سلامت و طاقت',
    icon: '🏹',
    statBonus: 'افزایش جان و حداکثر جان',
    badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
    bgGradient: 'from-rose-950/40 via-oled to-rose-900/10 border-rose-900/40',
  },
];

const DURATION_OPTIONS = [
  {
    minutes: 15,
    label: '۱۵ دقیقه',
    tag: 'کوتاه',
    rewardMultiplier: 'پاداش: ۱x',
    riskText: 'ریسک: ناچیز (۵٪)',
    riskLevel: 'low',
  },
  {
    minutes: 60,
    label: '۱ ساعت',
    tag: 'متوسط',
    rewardMultiplier: 'پاداش: ۳.۵x',
    riskText: 'ریسک: پایین (۱۵٪)',
    riskLevel: 'medium',
  },
  {
    minutes: 240,
    label: '۴ ساعت',
    tag: 'طولانی',
    rewardMultiplier: 'پاداش: ۱۲x',
    riskText: 'ریسک: قابل توجه (۳۵٪)',
    riskLevel: 'high',
  },
  {
    minutes: 600,
    label: '۱۰ ساعت',
    tag: 'افسانه‌ای',
    rewardMultiplier: 'پاداش: ۴۰x (نمایی 🚀)',
    riskText: 'ریسک: سنگین (۶۰٪ خطر جراحت/خسارت)',
    riskLevel: 'extreme',
  },
];

function formatTimeLeft(seconds: number): string {
  if (seconds <= 0) return 'READY';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function HomePanel({
  state,
  busy,
  onReturnHome,
  onEnterCave,
  onStartActivity,
  onSpeedUp,
  onCancel,
  onClaim,
}: HomePanelProps) {
  const [selectedActivity, setSelectedActivity] =
    useState<ActivityDef | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(15);
  const [claimResult, setClaimResult] = useState<HomeActionResult | null>(
    null,
  );
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  const active = state.activeHomeActivity;

  useEffect(() => {
    if (!active) {
      setRemainingSec(0);
      setProgressPercent(0);
      return;
    }

    const updateTimer = () => {
      const startMs = new Date(active.startTime).getTime();
      const totalMs = active.durationMinutes * 60 * 1000;
      const elapsedMs = Date.now() - startMs;
      const leftMs = Math.max(0, totalMs - elapsedMs);
      const secLeft = Math.ceil(leftMs / 1000);
      const pct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

      setRemainingSec(secLeft);
      setProgressPercent(pct);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [active]);

  const remainingMinutes = Math.ceil(remainingSec / 60);
  const speedUpCost = Math.max(2, Math.ceil(remainingMinutes / 15) * 2);

  const handleStartConfirm = async () => {
    if (!selectedActivity) return;
    try {
      await onStartActivity(selectedActivity.id, selectedDuration);
      setSelectedActivity(null);
    } catch {
      // Handled upstream toast
    }
  };

  const handleClaimReward = async () => {
    try {
      const res = await onClaim();
      if (res && res.result) {
        setClaimResult(res.result);
      }
    } catch {
      // Toast handles error
    }
  };

  const activeDef = active
    ? ACTIVITIES.find((a) => a.id === active.activityId)
    : null;

  return (
    <div className="flex flex-col gap-5 px-4 py-4 text-right">
      {/* Header Banner */}
      <div className="rounded-xl border border-amber/30 bg-gradient-to-l from-amber-950/30 via-oled to-amber-900/10 p-4 shadow-lg shadow-amber/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏡</span>
            <h2 className="font-serif text-lg font-bold text-amber amber-text-glow">
              خانه و پناهگاه
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-amber/30 bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber">
            <IconCoin size={16} />
            <span>{state.stats.gold} سکه</span>
          </div>
        </div>
        <p className="mt-1 text-xs text-ink-muted leading-relaxed">
          در خانه می‌توانید با تمرین و کاوش‌های زمان‌دار، قدرتمندتر شوید. هرچه زمان بیشتری اختصاص دهید، پاداش‌ها و ریسک‌ها به صورت نمایی افزایش می‌یابند.
        </p>
        {state.homeUnlocked && onEnterCave && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void onEnterCave()}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-amber/40 bg-gradient-to-r from-amber-600/90 to-amber-500/90 py-2 text-xs font-bold text-oled shadow-md hover:brightness-110 active:scale-98 transition"
          >
            <span>⛰️ خروج از خانه و ورود به غار</span>
          </button>
        )}
      </div>

      {/* Locked / Return state if not homeUnlocked */}
      {!state.homeUnlocked && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-amber/40 bg-oled-surface p-6 text-center shadow-xl">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-amber/50 bg-amber-950/50 text-3xl shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            🚪
          </div>
          <h3 className="font-serif text-base font-bold text-ink">
            بازگشت به پناهگاه امن
          </h3>
          <p className="mt-2 max-w-xs text-xs text-ink-muted leading-relaxed">
            شما در طول ماجراجویی از خانه دور شده‌اید. برای بازگشت به خانه و استفاده از کارگاه تمرین، باید مسافت خطرانگیز را طی کنید.
          </p>

          <button
            type="button"
            disabled={busy || state.stats.gold < 20}
            onClick={() => void onReturnHome()}
            className="mt-5 flex items-center gap-2 rounded-xl border border-amber bg-gradient-to-r from-amber-600 to-amber-500 px-6 py-2.5 text-xs font-bold text-oled shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            <IconCoin size={18} />
            <span>بازگشت به خانه (پرداخت ۲۰ سکه)</span>
          </button>
          {state.stats.gold < 20 && (
            <span className="mt-2 text-[11px] text-red-400">
              سکه کافی ندارید (حداقل ۲۰ سکه نیاز است)
            </span>
          )}
        </div>
      )}

      {/* Active Activity Progress Card */}
      {state.homeUnlocked && active && (
        <div className="rounded-xl border border-amber/50 bg-oled-surface p-4 shadow-xl shadow-amber/10">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{activeDef?.icon || '⏱️'}</span>
              <div>
                <h3 className="font-serif text-sm font-bold text-ink">
                  {activeDef?.title || active.activityId}
                </h3>
                <span className="text-[11px] text-ink-muted">
                  مدت زمان کل: {active.durationMinutes} دقیقه
                </span>
              </div>
            </div>
            <span className="rounded-full border border-amber/40 bg-amber-950/40 px-3 py-1 text-xs font-bold text-amber">
              در حال انجام
            </span>
          </div>

          {/* Timer & Progress */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-ink">
              <span>زمان باقی‌مانده:</span>
              <span className="text-base font-bold text-amber tracking-wider dir-ltr">
                {formatTimeLeft(remainingSec)}
              </span>
            </div>

            {/* Gamified Animated Progress Bar */}
            <div className="relative h-3.5 w-full overflow-hidden rounded-full border border-amber/30 bg-oled-dim">
              <div
                className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-ink-muted dir-ltr">
              <span>{Math.round(progressPercent)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex items-center justify-end gap-2">
            {remainingSec <= 0 ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleClaimReward}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-500 bg-gradient-to-r from-emerald-600 to-emerald-500 py-2.5 text-xs font-bold text-oled shadow-lg shadow-emerald-500/20 active:scale-95 transition"
              >
                <span>🎁 دریافت پاداش و پایان فعالیت</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onCancel()}
                  className="rounded-lg border border-line bg-oled-dim px-3 py-1.5 text-xs text-ink-muted hover:text-ink transition"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  disabled={busy || state.stats.gold < speedUpCost}
                  onClick={() => void onSpeedUp()}
                  className="flex items-center gap-1.5 rounded-lg border border-amber/50 bg-amber-950/60 px-4 py-1.5 text-xs font-bold text-amber hover:bg-amber-900/40 transition disabled:opacity-50"
                >
                  <IconZap size={14} />
                  <span>تسریع آنی ({speedUpCost} سکه)</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Available Activities List */}
      {state.homeUnlocked && !active && (
        <div className="flex flex-col gap-3">
          <h3 className="font-serif text-sm font-bold text-ink">
            فعالیت‌های قابل انجام
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {ACTIVITIES.map((act) => (
              <button
                key={act.id}
                type="button"
                disabled={busy}
                onClick={() => {
                  setSelectedActivity(act);
                  setSelectedDuration(15);
                }}
                className={`group relative flex items-center justify-between rounded-xl border p-3.5 text-right transition hover:scale-[1.01] active:scale-[0.99] bg-gradient-to-r ${act.bgGradient}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line/80 bg-oled-dim text-2xl shadow-inner">
                    {act.icon}
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-ink group-hover:text-amber transition">
                      {act.title}
                    </h4>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {act.subtitle}
                    </p>
                    <span
                      className={`mt-1.5 inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${act.badgeColor}`}
                    >
                      {act.statBonus}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-line/50 bg-oled-dim px-2.5 py-1 text-xs text-amber">
                  <span>انتخاب</span>
                  <span className="text-xs">←</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Duration Selector Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber/40 bg-oled-surface p-5 text-right shadow-2xl">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedActivity.icon}</span>
                <h3 className="font-serif text-base font-bold text-amber">
                  تنظیم مدت زمان: {selectedActivity.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="text-ink-muted hover:text-ink text-sm"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-xs text-ink-muted leading-relaxed">
              مدت زمان انجام این فعالیت را مشخص کنید. توجه داشته باشید با افزایش زمان، میزان پاداش و ریسک‌ها به صورت نمایی زیاد می‌شوند.
            </p>

            {/* Duration Options */}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = selectedDuration === opt.minutes;
                return (
                  <button
                    key={opt.minutes}
                    type="button"
                    onClick={() => setSelectedDuration(opt.minutes)}
                    className={`flex flex-col gap-1 rounded-xl border p-3 text-right transition ${
                      isSelected
                        ? 'border-amber bg-amber-950/50 text-amber shadow-md shadow-amber/10'
                        : 'border-line/60 bg-oled-dim text-ink-muted hover:border-amber/40 hover:text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{opt.label}</span>
                      <span className="rounded border border-amber/30 px-1.5 py-0.2 text-[9px] text-amber">
                        {opt.tag}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      {opt.rewardMultiplier}
                    </span>
                    <span className="text-[10px] text-rose-400">
                      {opt.riskText}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Risk vs Reward Exponential Gauge */}
            <div className="mt-4 rounded-xl border border-line/60 bg-oled-dim p-3">
              <div className="flex items-center justify-between text-xs font-bold text-ink">
                <span>تحلیل نمایی ریسک / پاداش:</span>
                <span className="text-amber">
                  {
                    DURATION_OPTIONS.find(
                      (o) => o.minutes === selectedDuration,
                    )?.tag
                  }
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>میزان پاداش:</span>
                  <span className="text-emerald-400 font-mono">
                    {
                      DURATION_OPTIONS.find(
                        (o) => o.minutes === selectedDuration,
                      )?.rewardMultiplier
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>احتمال حادثه/خطر:</span>
                  <span className="text-rose-400 font-mono">
                    {
                      DURATION_OPTIONS.find(
                        (o) => o.minutes === selectedDuration,
                      )?.riskText
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Confirm Start Button */}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={handleStartConfirm}
                className="flex-1 rounded-xl border border-amber bg-gradient-to-r from-amber-600 to-amber-500 py-2.5 text-xs font-bold text-oled shadow-lg active:scale-95 transition"
              >
                شروع فعالیت
              </button>
              <button
                type="button"
                onClick={() => setSelectedActivity(null)}
                className="rounded-xl border border-line bg-oled-dim px-4 py-2.5 text-xs text-ink-muted hover:text-ink"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Result Outcome Modal */}
      {claimResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-500/50 bg-oled-surface p-5 text-center shadow-2xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-950/50 text-3xl">
              🎉
            </div>
            <h3 className="font-serif text-lg font-bold text-emerald-400">
              گزارش فعالیت پایان‌یافته
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              نتایج حاصل از {claimResult.durationMinutes} دقیقه فعالیت:
            </p>

            {/* Rewards summary */}
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-right text-xs">
              <span className="font-bold text-emerald-400">
                پاداش‌های به دست آمده:
              </span>
              {claimResult.rewards.strengthGained && (
                <div className="flex justify-between text-ink">
                  <span>افزایش قدرت:</span>
                  <span className="font-bold text-amber">
                    +{claimResult.rewards.strengthGained} Strength
                  </span>
                </div>
              )}
              {claimResult.rewards.agilityGained && (
                <div className="flex justify-between text-ink">
                  <span>افزایش چابکی:</span>
                  <span className="font-bold text-emerald-400">
                    +{claimResult.rewards.agilityGained} Agility
                  </span>
                </div>
              )}
              {claimResult.rewards.intellectGained && (
                <div className="flex justify-between text-ink">
                  <span>افزایش خرد:</span>
                  <span className="font-bold text-sky-400">
                    +{claimResult.rewards.intellectGained} Intellect
                  </span>
                </div>
              )}
              {claimResult.rewards.goldGained && (
                <div className="flex justify-between text-ink">
                  <span>طلا و گنجینه:</span>
                  <span className="font-bold text-amber">
                    +{claimResult.rewards.goldGained} سکه
                  </span>
                </div>
              )}
              {claimResult.rewards.hpGained && (
                <div className="flex justify-between text-ink">
                  <span>تجدید جان:</span>
                  <span className="font-bold text-rose-400">
                    +{claimResult.rewards.hpGained} HP
                  </span>
                </div>
              )}
              {claimResult.rewards.maxHpGained && (
                <div className="flex justify-between text-ink">
                  <span>حداکثر جان:</span>
                  <span className="font-bold text-rose-300">
                    +{claimResult.rewards.maxHpGained} Max HP
                  </span>
                </div>
              )}
              {claimResult.rewards.itemsGained &&
                claimResult.rewards.itemsGained.length > 0 && (
                  <div className="mt-1 border-t border-emerald-500/20 pt-1.5 text-xs text-ink">
                    <span className="font-bold text-amber">آیتم‌های جدید:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {claimResult.rewards.itemsGained.map((it: any) => (
                        <span
                          key={it.id}
                          className="rounded border border-amber/40 bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber"
                        >
                          {it.icon} {it.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Risk events summary */}
            {claimResult.risksEncountered.logText && (
              <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-right text-xs text-rose-300 leading-relaxed">
                <span className="font-bold text-rose-400 block mb-1">
                  ⚠️ حادثه رخ داده:
                </span>
                {claimResult.risksEncountered.logText}
                {claimResult.risksEncountered.hpLost && (
                  <span className="block mt-1 font-bold">
                    آسیب وارد شده: -{claimResult.risksEncountered.hpLost} HP
                  </span>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setClaimResult(null)}
              className="mt-5 w-full rounded-xl border border-amber bg-amber-500 py-2.5 text-xs font-bold text-oled shadow-lg active:scale-95 transition"
            >
              عالیه، متوجه شدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
