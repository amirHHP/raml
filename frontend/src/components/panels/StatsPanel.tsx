import { CLASS_LABELS, type GameState } from '../../types/game';

export function StatsPanel({ state }: { state: GameState }) {
  const { stats, characterName, classType, playDayCount, featureUnlocks, unlockTurns } = state;
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

  const rows: Array<[string, string | number]> = [
    ['انرژی', `${stats.energy} / ${stats.maxEnergy}`],
  ];
  if (unlocks.hp) rows.push(['جان', `${stats.hp} / ${stats.maxHp}`]);
  if (unlocks.mana) rows.push(['مانا', `${stats.mana} / ${stats.maxMana}`]);
  if (unlocks.gold) rows.push(['طلا', stats.gold.toLocaleString('fa-IR')]);
  rows.push(
    ['قدرت', stats.strength],
    ['چابکی', stats.agility],
    ['خرد', stats.intellect],
    ['تجربه', `${stats.xp} / ${stats.level * 100}`],
    ['روز بازی', playDayCount],
    ['کوله‌پشتی از مرحله', turns.unlockInventoryAtTurn],
    ['جان از مرحله', turns.unlockHpAtTurn],
    ['مانا از مرحله', turns.unlockManaAtTurn],
    ['طلا از مرحله', turns.unlockGoldAtTurn],
  );

  return (
    <div className="px-4 py-4">
      <h2 className="mb-1 text-lg text-ink">
        {characterName || 'مسافر'}
      </h2>
      <p className="mb-5 text-sm text-ink-muted">
        {CLASS_LABELS[classType]} — سطح {stats.level}
      </p>
      <dl className="space-y-2">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-center justify-between border-b border-line/50 py-2 text-sm"
          >
            <dt className="text-ink-muted">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
