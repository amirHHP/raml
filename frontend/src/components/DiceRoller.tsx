import { useState } from 'react';
import { ROLL_TYPE_LABELS, type GameState } from '../types/game';
import { IconDice } from './icons';
import { diceFeedback, failureFeedback, successFeedback } from '../utils/haptics';
import { t } from '../utils/i18n';

function modifierFor(state: GameState): number {
  const type = state.pendingDiceRoll?.requiredRollType;
  if (!type || type === 'luck') return 0;
  return state.stats[type] ?? 0;
}

export function DiceRoller({
  state,
  busy,
  onRoll,
}: {
  state: GameState;
  busy: boolean;
  onRoll: (raw: number, modifier: number) => Promise<void>;
}) {
  const [spinning, setSpinning] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const pending = state.pendingDiceRoll;
  if (!pending) return null;

  const lang = state.language || 'fa';
  const isEn = lang === 'en';
  const mod = modifierFor(state);

  const rollTypeLabel = isEn
    ? pending.requiredRollType.toUpperCase()
    : ROLL_TYPE_LABELS[pending.requiredRollType];

  const handleRoll = async () => {
    if (busy || spinning) return;
    diceFeedback();
    setSpinning(true);
    let ticks = 0;
    const anim = window.setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 20));
      ticks += 1;
      if (ticks > 12) window.clearInterval(anim);
    }, 60);

    await new Promise((r) => setTimeout(r, 800));
    window.clearInterval(anim);
    const raw = 1 + Math.floor(Math.random() * 20);
    setFace(raw);
    setSpinning(false);
    if (raw + mod >= pending.minRollSuccess) {
      successFeedback();
    } else {
      failureFeedback();
    }
    await onRoll(raw, mod);
  };

  return (
    <div className="mx-4 mt-5 rounded-xl border border-amber/30 bg-panel px-4 py-5 text-center amber-glow">
      <p className="text-xs text-ink-muted">
        {t('diceCheckTitle', lang)}:{' '}
        <span className="text-amber">{rollTypeLabel}</span>
        {' — '}{t('targetScore', lang)} {pending.minRollSuccess}
        {mod > 0 && (
          <span className="text-ink-dim"> ({t('rollModifier', lang)} +{mod})</span>
        )}
      </p>

      <div
        className={`mx-auto my-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-line text-3xl font-semibold text-amber ${
          spinning ? 'animate-spin' : ''
        }`}
      >
        {face ?? '?'}
      </div>

      <button
        type="button"
        disabled={busy || spinning}
        onClick={() => void handleRoll()}
        className="inline-flex items-center gap-2 rounded-lg border border-amber bg-oled px-4 py-2.5 text-sm text-amber amber-glow transition enabled:hover:bg-amber/10 disabled:opacity-40"
      >
        <IconDice size={18} />
        {t('rollDiceButton', lang)}
      </button>
    </div>
  );
}
