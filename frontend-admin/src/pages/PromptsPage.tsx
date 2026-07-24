import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type { PromptItem, PromptKey } from '../types';
import { PROMPT_LABELS } from '../types';

export function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [active, setActive] = useState<PromptKey>('system');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getPrompts()
      .then((res) => {
        if (cancelled) return;
        setPrompts(res.prompts);
        const current = res.prompts.find((p) => p.key === 'system') || res.prompts[0];
        if (current) {
          setActive(current.key);
          setBody(current.body);
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

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-emerald-400">{message}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-md bg-amber px-4 py-2 font-medium text-stone-950 disabled:opacity-60"
      >
        {busy ? 'در حال ذخیره...' : 'ذخیره پرامپت'}
      </button>
    </div>
  );
}
