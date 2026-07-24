import {
  IconBell,
  IconBolt,
  IconCoin,
  IconFlask,
  IconHeart,
  IconSettings,
} from './icons';
import { CLASS_LABELS, type GameState } from '../types/game';
import { toFaDigits } from '../utils/formatCountdown';

export function StatusBar({
  state,
  sparse,
  onSettings,
  onInbox,
  unreadCount = 0,
}: {
  state: GameState;
  sparse?: boolean;
  onSettings: () => void;
  onInbox?: () => void;
  unreadCount?: number;
}) {
  const { stats, characterName, classType, storyTurnCount } = state;
  const stepLabel = `مرحله ${toFaDigits(storyTurnCount || 0)}`;

  // Early game: dark minimal chrome — energy + step count
  if (sparse || !state.unlockedFullUi) {
    return (
      <header className="sticky top-0 z-20 bg-oled px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="grid grid-cols-3 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 justify-self-start text-xs text-ink-dim">
            <IconBolt size={14} className="text-ink-muted" />
            انرژی {stats.energy}/{stats.maxEnergy}
          </span>
          <span className="justify-self-center text-xs text-ink-muted" aria-label={stepLabel}>
            {stepLabel}
          </span>
          <button
            type="button"
            onClick={onSettings}
            className="justify-self-end rounded-full p-2 text-ink-muted transition hover:text-ink-dim"
            aria-label="تنظیمات"
          >
            <IconSettings size={18} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line/60 bg-oled/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-medium tracking-wide text-ink">
            {characterName}
            <span className="text-ink-muted">
              {' '}
              — {CLASS_LABELS[classType]} — سطح {stats.level}
            </span>
          </h1>
          <p className="mt-0.5 text-xs text-ink-muted">{stepLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          {onInbox && (
            <button
              type="button"
              onClick={onInbox}
              className="relative rounded-full p-2 text-ink-dim transition hover:text-amber"
              aria-label="صندوق پیام"
            >
              <IconBell size={20} />
              {unreadCount > 0 && (
                <span className="absolute end-1 top-1 h-2 w-2 rounded-full bg-amber" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onSettings}
            className="rounded-full p-2 text-ink-dim transition hover:text-amber"
            aria-label="تنظیمات"
          >
            <IconSettings size={20} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-dim">
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
      </div>
    </header>
  );
}
