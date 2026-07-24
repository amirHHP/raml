export type AdminStats = {
  totalPlayers: number;
  awakened: number;
  banned: number;
  unlocked: number;
  dau: number;
  wau: number;
  withPurchases: number;
  classBreakdown: Record<string, number>;
  memoryStore: boolean;
};

export type AdminPlayerSummary = {
  deviceId: string;
  characterName: string;
  classType: string;
  status: 'active' | 'banned';
  awakened: boolean;
  unlockedFullUi: boolean;
  playDayCount: number;
  level: number;
  gold: number;
  energy: number;
  lastPlayedAt: string | null;
  createdAt: string | null;
  purchasedSkus: string[];
};

export type AiSettings = {
  openaiApiKeyMasked: string;
  openaiApiKeySet: boolean;
  openaiBaseUrl: string;
  openaiModel: string;
  useMockAi: boolean;
  updatedAt: string | null;
  provider?: 'gemini' | 'openai' | 'other';
  aiLiveFromTurn?: number;
};

export type GeminiRateLimit = {
  rpm: number | null;
  tpm: number | null;
  rpd: number | null;
  label: string;
  tier: 'free';
};

export type GeminiModelInfo = {
  id: string;
  displayName: string;
  description: string;
  inputTokenLimit: number | null;
  outputTokenLimit: number | null;
  rateLimit: GeminiRateLimit;
};

export type PromptKey = 'system' | 'awaken' | 'action' | 'dice';

export type PromptItem = {
  key: PromptKey;
  body: string;
  updatedAt: string | null;
};

export type AdminNotification = {
  id: string;
  title: string;
  body: string;
  targetType: 'all' | 'device';
  targetDeviceId: string | null;
  createdAt: string;
};

export type TabId = 'dashboard' | 'players' | 'ai' | 'prompts' | 'notifications';

export const CLASS_LABELS: Record<string, string> = {
  warrior: 'جنگجو',
  mage: 'جادوگر',
  rogue: 'حیل‌گر',
  ranger: 'کماندار',
};

export const PROMPT_LABELS: Record<PromptKey, string> = {
  system: 'سیستم (استاد بازی)',
  awaken: 'بیداری',
  action: 'اقدام',
  dice: 'نتیجه تاس',
};
