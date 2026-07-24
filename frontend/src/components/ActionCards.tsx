import { ACTION_ICONS } from './icons';
import type { GameOption, PlayerStats, StatKey } from '../types/game';

const STAT_LABEL: Record<StatKey, string> = {
  hp: 'جان',
  mana: 'مانا',
  gold: 'طلا',
  energy: 'انرژی',
  strength: 'قدرت',
  agility: 'چابکی',
  intellect: 'خرد',
};

function readStat(stats: PlayerStats, key: StatKey): number {
  return stats[key];
}

export function ActionCards({
  options,
  stats,
  busy,
  onChoose,
}: {
  options: GameOption[];
  stats: PlayerStats;
  busy: boolean;
  onChoose: (id: string) => void;
}) {
  if (!options.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 pt-5">
      {options.map((opt) => {
        const Icon = ACTION_ICONS[opt.icon] || ACTION_ICONS.search;
        const need = opt.condition_check.min;
        const have = readStat(stats, opt.condition_check.stat);
        const energyOk = stats.energy >= (opt.energy_cost ?? 1);
        const condOk = have >= need;
        const disabled = busy || !energyOk || !condOk;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(opt.id)}
            className={`flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-right transition ${
              disabled
                ? 'border-line/50 bg-panel/40 text-ink-muted opacity-45'
                : 'border-amber/40 bg-panel text-ink hover:border-amber hover:amber-glow'
            }`}
          >
            <Icon size={20} className={disabled ? 'text-ink-muted' : 'text-amber'} />
            <span className="text-sm leading-6">{opt.text}</span>
            {need > 0 && (
              <span className="text-[11px] text-ink-muted">
                {STAT_LABEL[opt.condition_check.stat]} {need}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
