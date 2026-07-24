import { useState, type FormEvent } from 'react';

export function LoginPage({
  onLogin,
  initialError,
}: {
  onLogin: (token: string) => void;
  initialError?: string | null;
}) {
  const [token, setToken] = useState('');
  const [error, setError] = useState(initialError || '');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = token.trim();
    if (!value) {
      setError('توکن ادمین را وارد کنید');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${value}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'ورود ناموفق');
      }
      onLogin(value);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-md rounded-xl border border-line bg-sand/80 p-6 shadow-2xl backdrop-blur"
      >
        <p className="text-xs tracking-[0.25em] text-amber">RAML</p>
        <h1 className="mt-2 text-2xl font-semibold">ورود به پنل ادمین</h1>
        <p className="mt-2 text-sm text-ink-dim">
          توکن تعریف‌شده در <code className="text-amber">ADMIN_TOKEN</code> را وارد کنید.
        </p>
        <label className="mt-6 block text-sm text-ink-dim">
          توکن
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
            autoComplete="current-password"
          />
        </label>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-md bg-amber py-2.5 font-medium text-stone-950 disabled:opacity-60"
        >
          {busy ? 'در حال ورود...' : 'ورود'}
        </button>
      </form>
    </div>
  );
}
