import { CLASS_LABELS, type GameState } from '../../types/game';

export function StatsPanel({ state }: { state: GameState }) {
  const { stats, characterName, classType, playDayCount, unlockedFullUi } = state;
  const rows = [
    ['جان', `${stats.hp} / ${stats.maxHp}`],
    ['مانا', `${stats.mana} / ${stats.maxMana}`],
    ['انرژی', `${stats.energy} / ${stats.maxEnergy}`],
    ['طلا', stats.gold.toLocaleString('fa-IR')],
    ['قدرت', stats.strength],
    ['چابکی', stats.agility],
    ['خرد', stats.intellect],
    ['تجربه', `${stats.xp} / ${stats.level * 100}`],
    ['روز بازی', playDayCount],
    ['رابط کامل', unlockedFullUi ? 'فعال' : `پس از ۳ روز (${playDayCount}/۳)`],
  ] as const;

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
