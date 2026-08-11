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

export type FunnelStep = {
  name: string;
  sessions: number;
  reachedPct: number;
  dropPct: number;
};

export type FunnelReport = {
  steps: FunnelStep[];
  signals: Array<{ name: string; sessions: number }>;
  timeToFirstChoiceMs: {
    median: number | null;
    p90: number | null;
    samples: number;
  };
  memoryStore: boolean;
};

export const FUNNEL_LABELS: Record<string, string> = {
  app_open: 'باز کردن بازی',
  name_focused: 'لمس فیلد اسم',
  awaken_submitted: 'زدن «باز کردن چشم‌ها»',
  awaken_complete: 'پایان انیمیشن بیداری',
  first_choice: 'اولین انتخاب',
  first_dice: 'اولین تاس',
  turn_5: 'رسیدن به نوبت ۵',
  intro_skipped: 'رد کردن متن آغازین',
  eyes_skipped: 'رد کردن انیمیشن چشم',
  story_skipped: 'رد کردن متن داستان',
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
  tokenbazaarApiKeyMasked?: string;
  tokenbazaarApiKeySet?: boolean;
  tokenbazaarBaseUrl?: string;
  imageModel?: string;
  useMockImageGen?: boolean;
  updatedAt: string | null;
  provider?: 'gemini' | 'openai' | 'other';
  aiLiveFromTurn?: number;
};

export type ImageGenResult = {
  ok: boolean;
  imageUrl?: string;
  b64_json?: string;
  model: string;
  prompt: string;
  size: string;
  ms: number;
  error?: string;
};

export type GameSettings = {
  storyMsPerWord: number;
  unlockInventoryAtTurn: number;
  unlockStatsAtTurn: number;
  unlockHpAtTurn: number;
  unlockManaAtTurn: number;
  unlockGoldAtTurn: number;
  referralRewardReferrerGold: number;
  referralRewardRefereeGold: number;
  updatedAt: string | null;
};

export type ReferralAdminStats = {
  totalReferredPlayers: number;
  totalReferralsCompleted: number;
  totalReferrerGoldGranted: number;
  totalRefereeGoldGranted: number;
  referrerGoldReward: number;
  refereeGoldReward: number;
  topReferrers: Array<{
    deviceId: string;
    characterName: string;
    referralCount: number;
  }>;
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

export type MilestonePromptItem = {
  turn: number;
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

export type ChangelogItem = {
  id: string;
  version: string;
  title: string;
  titleEn: string;
  items: string[];
  itemsEn: string[];
  createdAt: string;
};

export type TabId = 'dashboard' | 'players' | 'game' | 'ai' | 'prompts' | 'notifications' | 'changelogs';

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
