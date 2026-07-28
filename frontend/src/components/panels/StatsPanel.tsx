import { CharacterSilhouette } from '../CharacterSilhouette';
import { CLASS_LABELS, type GameState } from '../../types/game';
import { toFaDigits } from '../../utils/formatCountdown';
import { barPercent, listUnlockMilestones } from '../../utils/statSheet';

type BarTone = 'hp' | 'mana' | 'energy' | 'xp';

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="souls-divider mb-3 text-[11px] tracking-widest text-bone-dim">
      {children}
    </h3>
  );
}

function VitalBar({
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
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-bone-dim">{label}</span>
        {/* LTR keeps «value / max» from flipping order next to Persian text */}
        <span dir="ltr" className="tabular-nums text-bone">
          {toFaDigits(value)}
          <span className="text-bone-muted"> / {toFaDigits(max)}</span>
        </span>
      </div>
      <div className="souls-bar" role="presentation">
        <div
          className={`souls-bar-fill souls-bar-${tone}`}
          style={{ width: `${barPercent(value, max)}%` }}
        />
      </div>
    </div>
  );
}

function LeaderRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2 py-1.5 text-sm">
      <dt className="text-bone-dim">{label}</dt>
      <span className="souls-leader" aria-hidden />
      <dd
        className={`tabular-nums ${emphasis ? 'text-gold' : 'text-bone'}`}
      >
        {value}
      </dd>
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

  const attributes: Array<[string, number]> = [
    ['قدرت', stats.strength],
    ['چابکی', stats.agility],
    ['خرد', stats.intellect],
  ];

  return (
    <div className="souls-sheet space-y-7 px-4 py-6 pb-10">
      <header className="text-center">
        <p className="text-[10px] tracking-[0.35em] text-bone-muted">پیکره</p>
        <h2 className="mt-2 text-2xl tracking-wide text-bone amber-text-glow">
          {characterName || 'مسافر'}
        </h2>
        <p className="mt-1.5 text-xs tracking-widest text-gold/80">
          {CLASS_LABELS[classType]} · سطح {toFaDigits(stats.level)}
        </p>
      </header>

      <section
        className="souls-panel souls-corners px-4 py-6"
        aria-label="پیکر و پوشیدنی‌ها"
      >
        <CharacterSilhouette inventory={inventory} />
      </section>

      <section aria-label="توان">
        <SectionTitle>توان</SectionTitle>
        <div className="space-y-3.5">
          <VitalBar
            label="انرژی"
            value={stats.energy}
            max={stats.maxEnergy}
            tone="energy"
          />
          {unlocks.hp && (
            <VitalBar label="جان" value={stats.hp} max={stats.maxHp} tone="hp" />
          )}
          {unlocks.mana && (
            <VitalBar
              label="مانا"
              value={stats.mana}
              max={stats.maxMana}
              tone="mana"
            />
          )}
          <VitalBar label="تجربه" value={stats.xp} max={xpNeed} tone="xp" />
        </div>
      </section>

      <section aria-label="ویژگی‌ها">
        <SectionTitle>ویژگی‌ها</SectionTitle>
        <dl className="divide-y divide-bone/5">
          {attributes.map(([label, value]) => (
            <LeaderRow key={label} label={label} value={toFaDigits(value)} />
          ))}
          {unlocks.gold && (
            <LeaderRow label="طلا" value={toFaDigits(stats.gold)} emphasis />
          )}
        </dl>
      </section>

      <section aria-label="سفر">
        <SectionTitle>سفر</SectionTitle>
        <dl className="divide-y divide-bone/5">
          <LeaderRow label="مرحله" value={toFaDigits(storyTurnCount || 0)} />
          <LeaderRow label="روز بازی" value={toFaDigits(playDayCount)} />
        </dl>
      </section>

      {pendingSeals.length > 0 && (
        <section aria-label="مهرهای نشکسته">
          <SectionTitle>مهرهای نشکسته</SectionTitle>
          <ul className="space-y-2">
            {pendingSeals.map((seal) => (
              <li
                key={seal.key}
                className="souls-panel flex items-center justify-between px-3 py-2.5 text-xs"
              >
                <span className="text-bone-muted">{seal.label}</span>
                <span className="text-bone-dim">
                  مرحلهٔ {toFaDigits(seal.turn)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
