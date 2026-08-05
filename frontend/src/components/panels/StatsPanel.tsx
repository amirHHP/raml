import { CharacterSilhouette } from '../CharacterSilhouette';
import { CLASS_LABELS, type ClassType, type GameState } from '../../types/game';
import { toFaDigits } from '../../utils/formatCountdown';
import { barPercent, listUnlockMilestones } from '../../utils/statSheet';

type BarTone = 'hp' | 'mana' | 'energy' | 'xp';

const VITAL_CONFIG: Record<
  BarTone,
  { icon: string; title: string; color: string; border: string; bgFill: string }
> = {
  energy: {
    icon: '⚡',
    title: 'انرژی',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bgFill: 'bg-gradient-to-r from-amber-600 to-yellow-400',
  },
  hp: {
    icon: '❤️',
    title: 'جان',
    color: 'text-rose-400',
    border: 'border-rose-500/30',
    bgFill: 'bg-gradient-to-r from-rose-700 to-red-500',
  },
  mana: {
    icon: '💧',
    title: 'مانا',
    color: 'text-sky-400',
    border: 'border-sky-500/30',
    bgFill: 'bg-gradient-to-r from-sky-700 to-cyan-400',
  },
  xp: {
    icon: '⭐',
    title: 'تجربه',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bgFill: 'bg-gradient-to-r from-emerald-700 to-green-400',
  },
};

function getHeroTitle(level: number, classType: ClassType): string {
  if (level <= 2) return 'مسافر تازه‌کار';
  if (level <= 4) return 'رهجوی تاریکی';
  if (level <= 7) return 'قهرمان غارها';
  if (level <= 10) return 'استاد سایه‌ها';
  if (classType === 'warrior') return 'دلاور بی‌پایان';
  if (classType === 'mage') return 'استاد آرکین غارها';
  if (classType === 'rogue') return 'سایه‌پیمای کهن';
  return 'شکارچی افسانه‌ای';
}

function SectionTitle({ icon, children }: { icon: string; children: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2 border-b border-bone/10 pb-2">
      <span className="text-base">{icon}</span>
      <h3 className="text-xs font-bold tracking-widest text-bone-dim">{children}</h3>
    </div>
  );
}

function VitalCard({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: BarTone;
}) {
  const cfg = VITAL_CONFIG[tone];
  const pct = barPercent(value, max);

  return (
    <div className={`rounded-xl border ${cfg.border} bg-oled/80 p-3 shadow-sm backdrop-blur-sm`}>
      <div className="mb-2 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{cfg.icon}</span>
          <span className={cfg.color}>{label}</span>
        </div>
        <div dir="ltr" className="font-mono tabular-nums text-bone">
          {toFaDigits(value)} <span className="text-bone-muted text-[11px]">/ {toFaDigits(max)}</span>
          <span className="mr-1 text-[10px] text-bone-dim">({pct}%)</span>
        </div>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/60 p-0.5 border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${cfg.bgFill}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function AttributeCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  subtext: string;
  color: string;
}) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-bone/10 bg-oled/70 p-3 shadow-inner">
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
        <span className={`text-base font-extrabold tabular-nums ${color}`}>
          +{toFaDigits(value)}
        </span>
      </div>
      <div className="mt-2">
        <div className="text-xs font-bold text-bone">{label}</div>
        <div className="mt-0.5 text-[10px] text-bone-muted">{subtext}</div>
      </div>
    </div>
  );
}

export function StatsPanel({ state }: { state: GameState }) {
  const {
    stats,
    characterName,
    classType,
    playDayCount,
    storyTurnCount,
    inventory,
    featureUnlocks,
    unlockTurns,
  } = state;

  const unlocks = featureUnlocks || {
    inventory: false,
    stats: false,
    hp: false,
    mana: false,
    gold: false,
    home: false,
  };
  const turns = unlockTurns || {
    unlockInventoryAtTurn: 10,
    unlockStatsAtTurn: 20,
    unlockHpAtTurn: 20,
    unlockManaAtTurn: 30,
    unlockGoldAtTurn: 40,
  };

  const xpNeed = stats.level * 100;
  const milestones = listUnlockMilestones(unlocks, turns);
  const pendingSeals = milestones.filter((m) => !m.unlocked);

  const heroTitle = getHeroTitle(stats.level, classType);
  const equippedCount = inventory.filter((i) => Boolean(i.equipSlot)).length;

  // Gamified Combat Power Score
  const combatPower = Math.floor(
    stats.strength * 12 +
      stats.agility * 10 +
      stats.intellect * 10 +
      stats.maxHp * 2 +
      stats.level * 45 +
      equippedCount * 35,
  );

  return (
    <div className="souls-sheet space-y-6 px-4 py-6 pb-12">
      {/* Gamified Header */}
      <header className="relative rounded-2xl border border-amber/30 bg-gradient-to-b from-amber-950/20 via-oled/90 to-black p-5 text-center shadow-lg backdrop-blur-md">
        <div className="absolute right-4 top-4 rounded-full bg-amber/10 px-2.5 py-1 text-[10px] font-bold text-amber border border-amber/30">
          تب: حال من
        </div>
        <p className="text-[10px] font-semibold tracking-[0.3em] text-bone-muted uppercase">
          شناسنامهٔ قهرمان
        </p>

        <h2 className="mt-2 text-2xl font-black tracking-wide text-bone amber-text-glow">
          {characterName || 'مسافر تاریکی'}
        </h2>

        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="rounded-md border border-gold/30 bg-gold/10 px-2 py-0.5 text-xs font-bold text-gold">
            {CLASS_LABELS[classType]}
          </span>
          <span className="text-bone-muted">•</span>
          <span className="text-xs font-medium text-bone-dim">
            سطح {toFaDigits(stats.level)}
          </span>
          <span className="text-bone-muted">•</span>
          <span className="text-xs font-semibold text-amber">{heroTitle}</span>
        </div>

        {/* Combat Power Rating Badge */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-4 py-2 text-amber shadow-[0_0_12px_rgba(245,158,11,0.2)]">
          <span className="text-base">⚔️</span>
          <div className="text-right">
            <div className="text-[10px] font-medium text-amber/80">قدرت رزم (Combat Rating)</div>
            <div className="text-sm font-extrabold tabular-nums tracking-wide">
              {toFaDigits(combatPower)}
            </div>
          </div>
        </div>
      </header>

      {/* Character Silhouette & Active Equipment */}
      <section
        className="souls-panel souls-corners relative overflow-hidden px-4 py-6 shadow-md"
        aria-label="پیکر و تجهیزات"
      >
        <CharacterSilhouette inventory={inventory} classType={classType} />
      </section>

      {/* Gamified Vitals */}
      <section aria-label="ذخایر و انرژی نبرد">
        <SectionTitle icon="⚡">ذخایر و انرژی نبرد</SectionTitle>
        <div className="space-y-3">
          <VitalCard
            label="انرژی اقدام"
            value={stats.energy}
            max={stats.maxEnergy}
            tone="energy"
          />
          {unlocks.hp && (
            <VitalCard label="میزان جان" value={stats.hp} max={stats.maxHp} tone="hp" />
          )}
          {unlocks.mana && (
            <VitalCard
              label="ذخیره مانا"
              value={stats.mana}
              max={stats.maxMana}
              tone="mana"
            />
          )}
          <VitalCard label="پیشرفت سطح (XP)" value={stats.xp} max={xpNeed} tone="xp" />
        </div>
      </section>

      {/* Gamified Attributes */}
      <section aria-label="ویژگی‌های رزمی">
        <SectionTitle icon="🎮">ویژگی‌های اصلی رزمی</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <AttributeCard
            icon="💪"
            label="قدرت فیزیکی"
            value={stats.strength}
            subtext="افزایش آسیب شمشیر و جان"
            color="text-amber-400"
          />
          <AttributeCard
            icon="⚡"
            label="چابکی و دوج"
            value={stats.agility}
            subtext="سرعت حرکت و طلای غنیمت"
            color="text-emerald-400"
          />
          <AttributeCard
            icon="🧠"
            label="خرد و جادو"
            value={stats.intellect}
            subtext="قدرت طلسم‌ها و مانا"
            color="text-sky-400"
          />
          {unlocks.gold && (
            <AttributeCard
              icon="🪙"
              label="گنجینه طلا"
              value={stats.gold}
              subtext="سکه و نقدینگی خریدهای بازار"
              color="text-yellow-300"
            />
          )}
        </div>
      </section>

      {/* Gamified Journey & Stats */}
      <section aria-label="خلاصهٔ کارنامه سفر">
        <SectionTitle icon="🗺️">خلاصه کارنامه سفر</SectionTitle>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-bone/10 bg-oled/80 p-3">
            <div className="text-lg font-black text-amber tabular-nums">
              {toFaDigits(storyTurnCount || 0)}
            </div>
            <div className="mt-1 text-[10px] text-bone-muted">مرحله طی شده</div>
          </div>
          <div className="rounded-xl border border-bone/10 bg-oled/80 p-3">
            <div className="text-lg font-black text-emerald-400 tabular-nums">
              {toFaDigits(playDayCount)}
            </div>
            <div className="mt-1 text-[10px] text-bone-muted">روزهای زنده مانده</div>
          </div>
          <div className="rounded-xl border border-bone/10 bg-oled/80 p-3">
            <div className="text-lg font-black text-sky-400 tabular-nums">
              {toFaDigits(inventory.length)}
            </div>
            <div className="mt-1 text-[10px] text-bone-muted">آیتم کوله‌پشتی</div>
          </div>
        </div>
      </section>

      {/* Destiny Milestones & Seals */}
      {pendingSeals.length > 0 && (
        <section aria-label="مهرهای سرنوشت پیش‌رو">
          <SectionTitle icon="🔐">مهرهای سرنوشت پیش‌رو</SectionTitle>
          <div className="space-y-2">
            {pendingSeals.map((seal) => (
              <div
                key={seal.key}
                className="souls-panel flex items-center justify-between rounded-xl px-3.5 py-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-bone-muted">🔒</span>
                  <span className="font-medium text-bone">{seal.label}</span>
                </div>
                <span className="rounded bg-bone/10 px-2 py-1 text-[11px] font-semibold text-bone-dim">
                  فتح در مرحلهٔ {toFaDigits(seal.turn)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
