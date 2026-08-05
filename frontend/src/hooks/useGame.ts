import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { initFunnel, track } from '../analytics/funnel';
import type { GameState, InboxItem, ShopSku, TabId } from '../types/game';

export function useGame() {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('story');
  const [shop, setShop] = useState<ShopSku[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const busyRef = useRef(false);
  busyRef.current = busy;

  const refreshInbox = useCallback(async () => {
    const inbox = await api.getInbox();
    setInboxItems(inbox.items);
    setUnreadCount(inbox.unreadCount);
    return inbox;
  }, []);

  const refresh = useCallback(async () => {
    const s = await api.getState();
    setState(s);
    return s;
  }, []);

  /** Background sync: energy/timers only — never overwrite story or options. */
  const refreshEnergy = useCallback(async () => {
    const s = await api.getState();
    setState((prev) => {
      if (!prev) return s;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          energy: s.stats.energy,
          maxEnergy: s.stats.maxEnergy,
        },
        msUntilNextEnergy: s.msUntilNextEnergy,
        energyRegenMinutes: s.energyRegenMinutes,
        storyMsPerWord: s.storyMsPerWord ?? prev.storyMsPerWord,
        aiMode: s.aiMode ?? prev.aiMode,
        aiMockReason: s.aiMockReason ?? prev.aiMockReason,
        lastAiSource: s.lastAiSource ?? prev.lastAiSource,
        lastAiError: s.lastAiError ?? prev.lastAiError,
      };
    });
    return s;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const [s, shopRes, inbox] = await Promise.all([
          api.getState(),
          api.getShop(),
          api.getInbox(),
        ]);
        if (!cancelled) {
          setState(s);
          setShop(shopRes.items);
          setInboxItems(inbox.items);
          setUnreadCount(inbox.unreadCount);
          setError(null);
          initFunnel(!s.awakened);
          track('app_open');
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

  // Poll energy regen + inbox only — never advances the story
  useEffect(() => {
    if (!state?.awakened) return;
    const id = window.setInterval(() => {
      if (document.hidden || busyRef.current) return;
      void refreshEnergy().catch(() => undefined);
      void refreshInbox().catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [state?.awakened, refreshEnergy, refreshInbox]);

  // Auto-dismiss toast (local clear only — avoid full state replace mid-story)
  useEffect(() => {
    if (!state?.toastMessage) return;
    const ms = state.toastMessage.startsWith('خطای AI') ? 7000 : 3200;
    const id = window.setTimeout(() => {
      void api.clearToast().catch(() => undefined);
      setState((prev) => (prev ? { ...prev, toastMessage: null } : prev));
    }, ms);
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
      if ((s.storyTurnCount || 0) >= 5) track('turn_5');
    }
  };

  const submitDice = async (rawRoll: number, modifier: number) => {
    const total = rawRoll + modifier;
    track('first_dice');
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

  const markInboxRead = async (id: string) => {
    try {
      const res = await api.markInboxRead(id);
      setUnreadCount(res.unreadCount);
      setInboxItems((prev) =>
        prev.map((item) => (item.id === id ? res.item : item)),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const restoreSave = async (saveCode: string) => {
    const s = await run(async () => {
      const state = await api.restore(saveCode);
      const inbox = await api.getInbox();
      setInboxItems(inbox.items);
      setUnreadCount(inbox.unreadCount);
      return state;
    });
    if (s) {
      setState(s);
      setTab('story');
      return true;
    }
    return false;
  };

  const returnHome = async () => {
    const s = await run(() => api.returnHome());
    if (s) setState(s);
  };

  const startHomeActivity = async (
    activityId: string,
    durationMinutes: number,
  ) => {
    const s = await run(() =>
      api.startHomeActivity(activityId, durationMinutes),
    );
    if (s) setState(s);
  };

  const speedUpHomeActivity = async () => {
    const s = await run(() => api.speedUpHomeActivity());
    if (s) setState(s);
  };

  const cancelHomeActivity = async () => {
    const s = await run(() => api.cancelHomeActivity());
    if (s) setState(s);
  };

  const claimHomeActivity = async () => {
    const res = await run(() => api.claimHomeActivity());
    if (res && res.state) {
      setState(res.state);
      return res;
    }
    return null;
  };

  const toggleEquip = async (itemId: string) => {
    const s = await run(() => api.toggleEquip(itemId));
    if (s) setState(s);
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
    inboxOpen,
    setInboxOpen,
    inboxItems,
    unreadCount,
    markInboxRead,
    refreshInbox,
    awaken,
    choose,
    submitDice,
    claimAd,
    buySku,
    unlockDebug,
    restoreSave,
    refresh,
    refreshEnergy,
    returnHome,
    startHomeActivity,
    speedUpHomeActivity,
    cancelHomeActivity,
    claimHomeActivity,
    toggleEquip,
  };
}
