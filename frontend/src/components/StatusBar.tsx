import {
  IconBolt,
  IconCoin,
  IconFlask,
  IconHeart,
  IconSettings,
} from './icons';
import { CLASS_LABELS, type GameState } from '../types/game';

export function StatusBar({
  state,
  sparse,
  onSettings,
}: {
  state: GameState;
  sparse?: boolean;
  onSettings: () => void;
}) {
  const { stats, characterName, classType } = state;

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-oled/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {sparse || !state.awakened ? (
            <p className="text-sm text-ink-muted">رمل</p>
          ) : (
            <>
              <h1 className="truncate text-base font-medium tracking-wide text-ink">
                {characterName}
                <span className="text-ink-muted">
                  {' '}
                  — {CLASS_LABELS[classType]} — سطح {stats.level}
                </span>
              </h1>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onSettings}
          className="rounded-full p-2 text-ink-dim transition hover:text-amber"
          aria-label="تنظیمات"
        >
          <IconSettings size={20} />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-dim">
        {sparse || !state.unlockedFullUi ? (
          <span className="inline-flex items-center gap-1 text-amber amber-text-glow">
            <IconBolt size={14} />
            انرژی {stats.energy}/{stats.maxEnergy}
          </span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1">
              <IconHeart size={14} className="text-red-400/80" />
              جان: {stats.hp}/{stats.maxHp}
            </span>
            <span className="text-line">|</span>
            <span className="inline-flex items-center gap-1">
              <IconFlask size={14} className="text-sky-400/80" />
              مانا: {stats.mana}/{stats.maxMana}
            </span>
            <span className="text-line">|</span>
            <span className="inline-flex items-center gap-1">
              <IconCoin size={14} className="text-amber" />
              {stats.gold.toLocaleString('fa-IR')}
            </span>
            <span className="text-line">|</span>
            <span className="inline-flex items-center gap-1 text-amber amber-text-glow">
              <IconBolt size={14} />
              {stats.energy}/{stats.maxEnergy}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
