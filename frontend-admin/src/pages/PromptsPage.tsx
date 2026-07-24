import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { MilestonePromptItem, PromptItem, PromptKey } from '../types';
import { PROMPT_LABELS } from '../types';

export function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [active, setActive] = useState<PromptKey>('system');
  const [body, setBody] = useState('');
  const [milestones, setMilestones] = useState<MilestonePromptItem[]>([]);
  const [milestoneInterval, setMilestoneInterval] = useState(10);
  const [editingTurn, setEditingTurn] = useState<number | null>(null);
  const [milestoneBody, setMilestoneBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([adminApi.getPrompts(), adminApi.getMilestonePrompts()])
      .then(([promptRes, milestoneRes]) => {
        if (cancelled) return;
        setPrompts(promptRes.prompts);
        const current = promptRes.prompts.find((p) => p.key === 'system') || promptRes.prompts[0];
        if (current) {
          setActive(current.key);
          setBody(current.body);
        }
        setMilestoneInterval(milestoneRes.interval);
        setMilestones(milestoneRes.prompts);
        const first = milestoneRes.prompts[0];
        if (first) {
          setEditingTurn(first.turn);
          setMilestoneBody(first.body);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const select = (key: PromptKey) => {
    setActive(key);
    const found = prompts.find((p) => p.key === key);
    setBody(found?.body || '');
    setMessage(null);
    setError(null);
  };

  const selectMilestone = (turn: number) => {
    setEditingTurn(turn);
    const found = milestones.find((m) => m.turn === turn);
    setMilestoneBody(found?.body || '');
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminApi.putPrompt(active, body);
      setPrompts((prev) => prev.map((p) => (p.key === active ? updated : p)));
      setMessage('پرامپت ذخیره شد');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const saveMilestone = async () => {
    if (editingTurn == null) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await adminApi.putMilestonePrompt(editingTurn, milestoneBody);
      setMilestones((prev) => {
        const exists = prev.some((m) => m.turn === updated.turn);
        const next = exists
          ? prev.map((m) => (m.turn === updated.turn ? updated : m))
          : [...prev, updated];
        return next.sort((a, b) => a.turn - b.turn);
      });
      setMessage(`پرامپت مرحله ${updated.turn} ذخیره شد`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addNextMilestone = () => {
    const maxTurn = milestones.reduce((max, m) => Math.max(max, m.turn), 0);
    const nextTurn = maxTurn + milestoneInterval;
    setEditingTurn(nextTurn);
    setMilestoneBody(
      `دستور ویژهٔ مرحله ${nextTurn} (اجباری):\n`,
    );
    setMessage(null);
    setError(null);
  };

  const removeMilestone = async () => {
    if (editingTurn == null) return;
    if (!milestones.some((m) => m.turn === editingTurn)) {
      setEditingTurn(milestones[0]?.turn ?? null);
      setMilestoneBody(milestones[0]?.body || '');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await adminApi.deleteMilestonePrompt(editingTurn);
      const next = milestones.filter((m) => m.turn !== editingTurn);
      setMilestones(next);
      const first = next[0];
      setEditingTurn(first?.turn ?? null);
      setMilestoneBody(first?.body || '');
      setMessage('پرامپت مرحله‌ای حذف شد');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const knownTurns = new Set(milestones.map((m) => m.turn));
  const turnTabs =
    editingTurn != null && !knownTurns.has(editingTurn)
      ? [...milestones.map((m) => m.turn), editingTurn].sort((a, b) => a - b)
      : milestones.map((m) => m.turn);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROMPT_LABELS) as PromptKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => select(key)}
            className={`rounded-md px-3 py-2 text-sm ${
              active === key ? 'bg-amber text-stone-950' : 'bg-sand-2 text-ink-dim'
            }`}
          >
            {PROMPT_LABELS[key]}
          </button>
        ))}
      </div>

      <p className="text-xs text-ink-muted">
        برای قالب‌های awaken / action / dice می‌توانید از متغیرهایی مثل{' '}
        <code className="text-amber">{'{{name}}'}</code>،{' '}
        <code className="text-amber">{'{{classType}}'}</code>،{' '}
        <code className="text-amber">{'{{stats}}'}</code> استفاده کنید.
      </p>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={18}
        className="w-full rounded-xl border border-line bg-sand/70 p-4 font-mono text-sm leading-6 text-ink outline-none focus:border-amber"
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
      >
        {busy ? 'در حال ذخیره...' : 'ذخیره پرامپت'}
      </button>

      <div className="mt-8 space-y-3 border-t border-line pt-6">
        <div>
          <h2 className="text-base font-medium text-ink">پرامپت‌های هر {milestoneInterval} مرحله</h2>
          <p className="mt-1 text-xs text-ink-muted">
            در مراحل {milestoneInterval}، {milestoneInterval * 2}، {milestoneInterval * 3}، … این متن به پرامپت همان نوبت اضافه
            می‌شود. مثلاً مرحله ۱۰: حتماً یک آیتم برای کوله‌پشتی پیدا کند.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {turnTabs.map((turn) => (
            <button
              key={turn}
              type="button"
              onClick={() => selectMilestone(turn)}
              className={`rounded-md px-3 py-2 text-sm ${
                editingTurn === turn ? 'bg-amber text-stone-950' : 'bg-sand-2 text-ink-dim'
              }`}
            >
              مرحله {turn}
            </button>
          ))}
          <button
            type="button"
            onClick={addNextMilestone}
            className="rounded-md border border-line px-3 py-2 text-sm text-ink-dim"
          >
            + مرحله بعدی
          </button>
        </div>

        {editingTurn != null && (
          <>
            <textarea
              value={milestoneBody}
              onChange={(e) => setMilestoneBody(e.target.value)}
              rows={10}
              className="w-full rounded-xl border border-line bg-sand/70 p-4 font-mono text-sm leading-6 text-ink outline-none focus:border-amber"
              placeholder={`دستور ویژهٔ مرحله ${editingTurn}…`}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveMilestone()}
                className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
              >
                {busy ? 'در حال ذخیره...' : `ذخیره مرحله ${editingTurn}`}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeMilestone()}
                className="rounded-md border border-line px-4 py-2 text-sm text-ink-dim disabled:opacity-60"
              >
                حذف
              </button>
            </div>
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}
    </div>
  );
}
