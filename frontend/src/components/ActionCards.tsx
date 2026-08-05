import type { CSSProperties } from 'react';
import { ACTION_ICONS } from './icons';
import type { GameOption, PlayerStats, StatKey } from '../types/game';
import { optionEffectLabel } from '../utils/optionEffect';
import { tapFeedback } from '../utils/haptics';

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
      {options.map((opt, index) => {
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
            style={{ '--card-index': index } as CSSProperties}
            onClick={() => {
              tapFeedback();
              onChoose(opt.id);
            }}
            className={`card-enter flex flex-col items-start gap-2 rounded-xl border px-3 py-3 text-right transition active:scale-[0.97] ${
              disabled
                ? 'border-line/50 bg-panel/40 text-ink-muted opacity-45'
                : 'border-amber/40 bg-panel text-ink hover:border-amber hover:amber-glow'
            }`}
          >
            <div className="flex w-full items-center justify-between gap-1">
              <Icon size={20} className={disabled ? 'text-ink-muted' : 'text-amber'} />
              {opt.item_reward && (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 border border-emerald-500/40 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                  <span>🎒</span>
                  <span>+ {opt.item_reward}</span>
                </span>
              )}
            </div>
            <span className="text-sm leading-6">{opt.text}</span>
            <span className="text-[11px] text-ink-muted">{optionEffectLabel(opt)}</span>
          </button>
        );
      })}
    </div>
  );
}
