import type { ClassType, GameState, ShopSku } from '../types/game';

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
  getShop: () => request<{ items: ShopSku[] }>('/api/mono/shop'),
  claimAdReward: () =>
    request<GameState>('/api/mono/ads/reward', { method: 'POST', body: '{}' }),
  verifyIap: (sku: string, purchaseToken = `mock_${Date.now()}`) =>
    request<GameState>('/api/mono/iap/verify', {
      method: 'POST',
      body: JSON.stringify({ sku, purchaseToken }),
    }),
};
