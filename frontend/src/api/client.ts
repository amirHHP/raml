import type { ClassType, GameState, InboxItem, ShopSku } from '../types/game';
import { assertValidSaveCode } from '../utils/saveCode';

const DEVICE_KEY = 'raml_device_id';

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `raml-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/** Switch the local save identity (used when restoring a prior code). */
export function setDeviceId(id: string): void {
  localStorage.setItem(DEVICE_KEY, assertValidSaveCode(id));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-device-id': getDeviceId(),
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'خطای شبکه');
  }
  return data as T;
}

export const api = {
  getState: () => request<GameState>('/api/game/state'),
  /** Look up a save by code, then bind this device to that identity. */
  restore: async (saveCode: string) => {
    const trimmed = assertValidSaveCode(saveCode);
    const res = await fetch('/api/game/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveCode: trimmed }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { error?: string }).error || 'خطای شبکه');
    }
    const state = data as GameState;
    setDeviceId(state.deviceId);
    return state;
  },
  awaken: (characterName: string, classType: ClassType = 'warrior') =>
    request<GameState>('/api/game/awaken', {
      method: 'POST',
      body: JSON.stringify({ characterName, classType }),
    }),
  action: (optionId: string) =>
    request<GameState>('/api/game/action', {
      method: 'POST',
      body: JSON.stringify({ optionId }),
    }),
  dice: (payload: { rawRoll: number; modifier: number; total: number }) =>
    request<GameState>('/api/game/dice', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  clearToast: () =>
    request<GameState>('/api/game/toast/clear', { method: 'POST', body: '{}' }),
  debugUnlock: () =>
    request<GameState>('/api/game/debug/unlock', { method: 'POST', body: '{}' }),
  getInbox: () =>
    request<{ items: InboxItem[]; unreadCount: number }>('/api/game/inbox'),
  markInboxRead: (id: string) =>
    request<{ item: InboxItem; unreadCount: number }>(
      `/api/game/inbox/${encodeURIComponent(id)}/read`,
      { method: 'POST', body: '{}' },
    ),
  /** Fire-and-forget onboarding telemetry; keepalive so it survives page unload. */
  sendFunnelEvents: (
    sessionId: string,
    events: Array<{ name: string; atMs: number }>,
  ) =>
    fetch('/api/game/events', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': getDeviceId(),
      },
      body: JSON.stringify({ sessionId, events }),
    }),
  getShop: () => request<{ items: ShopSku[] }>('/api/mono/shop'),
  claimAdReward: () =>
    request<GameState>('/api/mono/ads/reward', { method: 'POST', body: '{}' }),
  verifyIap: (sku: string, purchaseToken = `mock_${Date.now()}`) =>
    request<GameState>('/api/mono/iap/verify', {
      method: 'POST',
      body: JSON.stringify({ sku, purchaseToken }),
    }),
};
