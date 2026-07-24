import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { GameState, ShopSku, TabId } from '../types/game';

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('story');
  const [shop, setShop] = useState<ShopSku[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(false);

  const refresh = useCallback(async () => {
    const s = await api.getState();
    setState(s);
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [s, shopRes] = await Promise.all([api.getState(), api.getShop()]);
        if (!cancelled) {
          setState(s);
          setShop(shopRes.items);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll energy regen lightly
  useEffect(() => {
    if (!state?.awakened) return;
    const id = window.setInterval(() => {
      void refresh().catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [state?.awakened, refresh]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!state?.toastMessage) return;
    const id = window.setTimeout(() => {
      void api.clearToast().then(setState).catch(() => undefined);
    }, 3200);
    return () => window.clearTimeout(id);
  }, [state?.toastMessage]);

  const run = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    try {
      setBusy(true);
      setError(null);
      return await fn();
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const awaken = async (name: string) => {
    const s = await run(() => api.awaken(name));
    if (s) {
      setState(s);
      setTab('story');
      return true;
    }
    return false;
  };

  const choose = async (optionId: string) => {
    const s = await run(() => api.action(optionId));
    if (s) {
      setState(s);
      setTab('story');
    }
  };

  const submitDice = async (rawRoll: number, modifier: number) => {
    const total = rawRoll + modifier;
    const s = await run(() => api.dice({ rawRoll, modifier, total }));
    if (s) setState(s);
  };

  const claimAd = async () => {
    const s = await run(() => api.claimAdReward());
    if (s) {
      setState(s);
      setAdOpen(false);
    }
  };

  const buySku = async (sku: string) => {
    const s = await run(() => api.verifyIap(sku));
    if (s) setState(s);
  };

  const unlockDebug = async () => {
    const s = await run(() => api.debugUnlock());
    if (s) {
      setState(s);
      setSettingsOpen(false);
    }
  };

  return {
    state,
    loading,
    busy,
    error,
    setError,
    tab,
    setTab,
    shop,
    settingsOpen,
    setSettingsOpen,
    adOpen,
    setAdOpen,
    awaken,
    choose,
    submitDice,
    claimAd,
    buySku,
    unlockDebug,
    refresh,
  };
}
