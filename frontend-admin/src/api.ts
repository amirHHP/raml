import type {
  AdminNotification,
  AdminPlayerSummary,
  AdminStats,
  AiSettings,
  ChangelogItem,
  FunnelReport,
  GameSettings,
  GeminiModelInfo,
  ImageGenResult,
  PromptItem,
  PromptKey,
  MilestonePromptItem,
  ReferralAdminStats,
} from './types';

const TOKEN_KEY = 'raml_admin_token';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'خطای شبکه');
  }
  return data as T;
}

export const adminApi = {
  getStats: () => request<AdminStats>('/api/admin/stats'),
  getFunnel: () => request<FunnelReport>('/api/admin/funnel'),
  listPlayers: (params: {
    q?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return request<{
      items: AdminPlayerSummary[];
      total: number;
      page: number;
      limit: number;
    }>(`/api/admin/players?${qs}`);
  },
  getPlayer: (deviceId: string) =>
    request<{
      summary: AdminPlayerSummary;
      state: Record<string, unknown>;
      storyHistory: string[];
    }>(`/api/admin/players/${encodeURIComponent(deviceId)}`),
  patchPlayer: (
    deviceId: string,
    body: {
      status?: 'active' | 'banned';
      unlockedFullUi?: boolean;
      refillEnergy?: boolean;
    },
  ) =>
    request<{ summary: AdminPlayerSummary }>(
      `/api/admin/players/${encodeURIComponent(deviceId)}`,
      { method: 'PATCH', body: JSON.stringify(body) },
    ),
  getAi: () => request<AiSettings>('/api/admin/ai'),
  putAi: (body: {
    openaiApiKey?: string;
    openaiBaseUrl?: string;
    openaiModel?: string;
    useMockAi?: boolean;
    tokenbazaarApiKey?: string;
    tokenbazaarBaseUrl?: string;
    imageModel?: string;
    useMockImageGen?: boolean;
  }) =>
    request<AiSettings>('/api/admin/ai', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  generateImage: (body: { prompt: string; model?: string; size?: string }) =>
    request<ImageGenResult>('/api/admin/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getGame: () => request<GameSettings>('/api/admin/game'),
  putGame: (body: {
    storyMsPerWord?: number;
    unlockInventoryAtTurn?: number;
    unlockStatsAtTurn?: number;
    unlockHpAtTurn?: number;
    unlockManaAtTurn?: number;
    unlockGoldAtTurn?: number;
    referralRewardReferrerGold?: number;
    referralRewardRefereeGold?: number;
  }) =>
    request<GameSettings>('/api/admin/game', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  getReferralStats: () => request<ReferralAdminStats>('/api/admin/referral/stats'),
  listGeminiModels: (apiKey?: string) =>
    request<{ models: GeminiModelInfo[]; baseUrlHint: string }>(
      '/api/admin/ai/gemini-models',
      {
        method: 'POST',
        body: JSON.stringify(apiKey ? { apiKey } : {}),
      },
    ),
  testAi: () =>
    request<{ ok: boolean; model?: string; ms?: number; sample?: string; error?: string }>(
      '/api/admin/ai/test',
      { method: 'POST', body: '{}' },
    ),
  getPrompts: () => request<{ prompts: PromptItem[] }>('/api/admin/prompts'),
  putPrompt: (key: PromptKey, body: string) =>
    request<PromptItem>(`/api/admin/prompts/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ body }),
    }),
  getMilestonePrompts: () =>
    request<{ interval: number; prompts: MilestonePromptItem[] }>(
      '/api/admin/milestone-prompts',
    ),
  putMilestonePrompt: (turn: number, body: string) =>
    request<MilestonePromptItem>(`/api/admin/milestone-prompts/${turn}`, {
      method: 'PUT',
      body: JSON.stringify({ body }),
    }),
  deleteMilestonePrompt: (turn: number) =>
    request<{ ok: boolean; turn: number }>(`/api/admin/milestone-prompts/${turn}`, {
      method: 'DELETE',
    }),
  listNotifications: () =>
    request<{ items: AdminNotification[] }>('/api/admin/notifications'),
  sendNotification: (body: {
    title: string;
    body: string;
    targetType: 'all' | 'device';
    targetDeviceId?: string;
  }) =>
    request<{ notification: AdminNotification & { delivered?: number } }>(
      '/api/admin/notifications',
      { method: 'POST', body: JSON.stringify(body) },
    ),
  listChangelogs: () =>
    request<{ items: ChangelogItem[] }>('/api/admin/changelogs'),
  createChangelog: (body: {
    version: string;
    title: string;
    titleEn?: string;
    items: string[];
    itemsEn?: string[];
  }) =>
    request<ChangelogItem>('/api/admin/changelogs', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteChangelog: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/changelogs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
