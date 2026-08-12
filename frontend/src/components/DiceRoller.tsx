import { useState, useRef, useCallback, useEffect } from 'react';
import { ROLL_TYPE_LABELS, type GameState } from '../types/game';
import { IconDice } from './icons';
import { diceFeedback, failureFeedback, successFeedback } from '../utils/haptics';
import { t } from '../utils/i18n';

function modifierFor(state: GameState): number {
  const type = state.pendingDiceRoll?.requiredRollType;
  if (!type || type === 'luck') return 0;
  return state.stats[type] ?? 0;
}

/* ── Spark particle on dice land ───────────────────────────────── */
function SparkBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const sparks = Array.from({ length: 10 }, (_, i) => {
    const angle = ((i / 10) * 360 + Math.random() * 36) * (Math.PI / 180);
    const dist = 38 + Math.random() * 28;
    const size = 2 + Math.random() * 2.5;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    return (
      <span
        key={i}
        className="dice-spark"
        style={{
          '--spark-x': `${x}px`,
          '--spark-y': `${y}px`,
          '--spark-size': `${size}px`,
          '--spark-delay': `${Math.random() * 80}ms`,
        } as React.CSSProperties}
      />
    );
  });
  return <div className="dice-spark-container">{sparks}</div>;
}

/* ── 3D D20 Dice component ─────────────────────────────────────── */
function D20Dice({
  spinning,
  face,
  settled,
}: {
  spinning: boolean;
  face: number | null;
  settled: boolean;
}) {
  return (
    <div className="dice-stage">
      <div className="dice-shadow" data-spinning={spinning} />
      <div
        className={`dice-d20 ${spinning ? 'dice-rolling' : ''} ${settled ? 'dice-settled' : ''}`}
      >
        {/* Front face — always shows the number */}
        <div className="dice-face dice-face-front">
          <span className="dice-number">{face ?? '?'}</span>
        </div>
        {/* Top face */}
        <div className="dice-face dice-face-top">
          <span className="dice-number">{face != null ? ((face + 6) % 20) + 1 : ''}</span>
        </div>
        {/* Bottom face */}
        <div className="dice-face dice-face-bottom">
          <span className="dice-number">{face != null ? ((face + 13) % 20) + 1 : ''}</span>
        </div>
        {/* Left face */}
        <div className="dice-face dice-face-left">
          <span className="dice-number">{face != null ? ((face + 3) % 20) + 1 : ''}</span>
        </div>
        {/* Right face */}
        <div className="dice-face dice-face-right">
          <span className="dice-number">{face != null ? ((face + 9) % 20) + 1 : ''}</span>
        </div>
        {/* Back face */}
        <div className="dice-face dice-face-back">
          <span className="dice-number">{face != null ? ((face + 17) % 20) + 1 : ''}</span>
        </div>
      </div>
      <SparkBurst active={settled} />
    </div>
  );
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
  const [settled, setSettled] = useState(false);
  const [face, setFace] = useState<number | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pending = state.pendingDiceRoll;
  if (!pending) return null;

  const lang = state.language || 'fa';
  const isEn = lang === 'en';
  const mod = modifierFor(state);

  const rollTypeLabel = isEn
    ? pending.requiredRollType.toUpperCase()
    : ROLL_TYPE_LABELS[pending.requiredRollType];

  const handleRoll = useCallback(async () => {
    if (busy || spinning) return;
    diceFeedback();
    setSettled(false);
    setSpinning(true);

    // Rapid face changes during the roll
    let ticks = 0;
    animRef.current = window.setInterval(() => {
      setFace(1 + Math.floor(Math.random() * 20));
      ticks += 1;
      if (ticks > 16) {
        if (animRef.current) window.clearInterval(animRef.current);
      }
    }, 55);

    await new Promise((r) => setTimeout(r, 1200));
    if (animRef.current) window.clearInterval(animRef.current);

    const raw = 1 + Math.floor(Math.random() * 20);
    setFace(raw);
    setSpinning(false);
    setSettled(true);

    if (raw + mod >= pending.minRollSuccess) {
      successFeedback();
    } else {
      failureFeedback();
    }

    // Clear settled state after sparks finish
    setTimeout(() => setSettled(false), 600);

    await onRoll(raw, mod);
  }, [busy, spinning, mod, pending.minRollSuccess, onRoll]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (animRef.current) window.clearInterval(animRef.current);
    };
  }, []);

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

      <D20Dice spinning={spinning} face={face} settled={settled} />

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

