import { useEffect, useState } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { adminApi, clearToken, getToken, setToken } from './api';
import type { TabId } from './types';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlayersPage } from './pages/PlayersPage';
import { AiPage } from './pages/AiPage';
import { GamePage } from './pages/GamePage';
import { PromptsPage } from './pages/PromptsPage';
import { NotificationsPage } from './pages/NotificationsPage';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'dashboard', label: 'داشبورد' },
  { id: 'players', label: 'بازیکن‌ها' },
  { id: 'game', label: 'بازی' },
  { id: 'ai', label: 'هوش مصنوعی' },
  { id: 'prompts', label: 'پرامپت‌ها' },
  { id: 'notifications', label: 'اعلان‌ها' },
];

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [tab, setTab] = useState<TabId>('dashboard');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!authed) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await adminApi.getStats();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) {
          clearToken();
          setAuthed(false);
          setError((e as Error).message);
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authed]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-dim">
        در حال بررسی دسترسی...
      </div>
    );
  }

  if (!authed) {
    return (
      <LoginPage
        initialError={error}
        onLogin={(token) => {
          setToken(token);
          setAuthed(true);
          setError(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs tracking-[0.2em] text-amber">RAML ADMIN</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink md:text-3xl">پنل مدیریت رمل</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            clearToken();
            setAuthed(false);
          }}
          className="rounded-md border border-line px-3 py-1.5 text-sm text-ink-dim hover:border-amber hover:text-amber"
        >
          خروج
        </button>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-2 text-sm transition ${
              tab === t.id
                ? 'bg-amber text-stone-950'
                : 'bg-sand-2 text-ink-dim hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 pb-10">
        {tab === 'dashboard' && <DashboardPage />}
        {tab === 'players' && <PlayersPage />}
        {tab === 'game' && <GamePage />}
        {tab === 'ai' && <AiPage />}
        {tab === 'prompts' && <PromptsPage />}
        {tab === 'notifications' && <NotificationsPage />}
      </main>
      <SpeedInsights />
    </div>
  );
}
