import { z } from 'zod';
import OpenAI from 'openai';
import type { AiGameResponse } from '../types/game';
import {
  getRuntimeAiSettings,
  onAiSettingsChange,
  type RuntimeAiSettings,
} from './aiSettings';
import { getPromptBody } from './promptService';
import { extractJson } from './jsonExtract';
import { AI_LIVE_FROM_TURN } from './aiPolicy';

const AiResponseSchema = z.object({
  story_text: z.string().min(1),
  current_location: z.string().default('ناشناخته'),
  enemy_line_art_type: z
    .enum([
      'none',
      'orc_guardian',
      'dragon',
      'skeleton',
      'shadow',
      'desert_spirit',
    ])
    .catch('none'),
  stats_update: z
    .object({
      hp: z.number().optional(),
      mana: z.number().optional(),
      gold: z.number().optional(),
      energy_change: z.number().optional(),
      strength: z.number().optional(),
      agility: z.number().optional(),
      intellect: z.number().optional(),
      xp: z.number().optional(),
    })
    .default({}),
  needs_dice_roll: z.boolean().default(false),
  required_roll_type: z
    .enum(['strength', 'agility', 'intellect', 'luck'])
    .nullable()
    .optional()
    .catch(null),
  min_roll_success: z.number().nullable().optional().catch(null),
  options: z
    .array(
      z.object({
        text: z.string(),
        icon: z
          .enum(['sword', 'spell', 'key', 'retreat', 'talk', 'search', 'shield'])
          .catch('search'),
        condition_check: z.object({
          stat: z
            .enum([
              'hp',
              'mana',
              'gold',
              'energy',
              'strength',
              'agility',
              'intellect',
            ])
            .catch('energy'),
          min: z.number().catch(0),
        }),
      }),
    )
    .default([]),
  discovered_item: z
    .object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      icon: z.string(),
      equip_slot: z
        .enum(['head', 'chest', 'hands', 'legs', 'feet', 'weapon', 'accessory'])
        .nullable()
        .optional()
        .catch(null),
    })
    .nullable()
    .optional()
    .catch(null),
  toast_message: z.string().nullable().optional().catch(null),
});

let client: OpenAI | null = null;
let clientFingerprint = '';

onAiSettingsChange(() => {
  client = null;
  clientFingerprint = '';
});

function fingerprint(settings: RuntimeAiSettings): string {
  return `${settings.openaiApiKey}|${settings.openaiBaseUrl}|${settings.openaiModel}|${settings.useMockAi}`;
}

function getClient(settings: RuntimeAiSettings): OpenAI {
  const fp = fingerprint(settings);
  if (!client || clientFingerprint !== fp) {
    client = new OpenAI({
      apiKey: settings.openaiApiKey,
      baseURL: settings.openaiBaseUrl,
    });
    clientFingerprint = fp;
  }
  return client;
}

/** Early-game options: only energy is visible/spent before full UI unlock. */
function energyOption(
  text: string,
  icon: AiGameResponse['options'][number]['icon'],
): AiGameResponse['options'][number] {
  return {
    text,
    icon,
    condition_check: { stat: 'energy', min: 0 },
  };
}

function chosenOptionFromPrompt(userPrompt: string): string {
  const match = userPrompt.match(/بازیکن این گزینه را انتخاب کرد: «([^»]+)»/);
  return match?.[1]?.trim() ?? '';
}

/** Turn-1 option texts, used only when no turn number is supplied. */
const PROLOGUE_FIRST_CHOICES = /بیرون بکش|فانوس|تو کیستی/;

/** Echoes the player's first choice back before the prologue dice check. */
function prologueDiceSetup(chosen: string): string {
  if (chosen.includes('فانوس')) {
    return 'نوک انگشتانت به شیشهٔ فانوس می‌رسد. فتیله می‌لرزد و سایه‌ای بلند روی شن کشیده می‌شود.';
  }
  if (chosen.includes('کیستی')) {
    return 'صدایت در کویر می‌شکند. آنچه زیر شن است یک لحظه بی‌حرکت می‌ماند — دارد گوش می‌دهد.';
  }
  return 'زور می‌زنی. شن مثل دهانی بسته می‌شود و چیزی پایین‌تر، محکم‌تر می‌کشد.';
}

/** Deterministic offline AI for local/dev and the first story turns. Exported for tests. */
export function mockAi(userPrompt: string, turnNumber?: number): AiGameResponse {
  const isAwaken = userPrompt.includes('چشم‌هایش را باز کرده');
  const isDice = userPrompt.includes('نتیجهٔ تاس');
  const success = userPrompt.includes('نتیجه: موفقیت');
  const chosen = chosenOptionFromPrompt(userPrompt);

  // Past the scripted prologue: keep advancing with fresh beats (avoids keyword loops).
  if (turnNumber != null && turnNumber >= AI_LIVE_FROM_TURN && !isAwaken && !isDice) {
    return lateMockBeat(chosen || userPrompt.slice(0, 40), turnNumber);
  }

  // Turn 1 — بیداری وسط بحران: تهدید مشخص، یک سؤال بی‌جواب، و سه گزینه با سه لحن متفاوت
  if (isAwaken) {
    return {
      story_text:
        'چشم باز می‌کنی و شن تا گلویت بالا آمده است. چیزی زیر خاک، مچ پایت را گرفته و آرام به پایین می‌کشد.\n\nچند قدم آن‌طرف‌تر فانوسی روی شن افتاده، و صدایی خش‌دار نامت را می‌خواند: «تو زودتر از موعد بیدار شدی.»',
      current_location: 'کویر رمل — گودِ شن',
      enemy_line_art_type: 'shadow',
      stats_update: { xp: 5 },
      needs_dice_roll: false,
      required_roll_type: null,
      min_roll_success: null,
      options: [
        energyOption('با تمام توان خودت را بیرون بکش', 'sword'),
        energyOption('دست به سوی فانوس دراز کن', 'key'),
        energyOption('فریاد بزن: تو کیستی؟', 'talk'),
      ],
      discovered_item: {
        id: 'sand_amulet',
        name: 'طلسم شن',
        description: 'در شن به دستت آمد؛ گرمای خفیفی دارد و به تپش قلبت پاسخ می‌دهد.',
        icon: 'amulet',
        equip_slot: 'accessory',
      },
      toast_message: 'آیتم جدید: طلسم شن',
    };
  }

  // Turn 3 — نتیجهٔ تاس؛ گزینه‌ها فقط انرژی (نه مانا/قدرت/چابکی)
  if (isDice) {
    return {
      story_text: success
        ? 'تاس به نفع تو می‌چرخد. با یک تکان از شن بیرون می‌آیی و آنچه پایت را گرفته بود در تاریکی فرومی‌رود. فانوس در دستت است و دهانهٔ غاری در چند قدمی می‌درخشد.'
        : 'تاس علیه توست. شن تا سینه‌ات بالا می‌آید و چیزی زیر خاک، ساق پایت را می‌درد. باید همین حالا تصمیم بگیری.',
      current_location: 'کویر رمل — گودِ شن',
      enemy_line_art_type: 'shadow',
      stats_update: success
        ? { xp: 15, gold: 25 }
        : { hp: -12, xp: 5 },
      needs_dice_roll: false,
      required_roll_type: null,
      min_roll_success: null,
      options: success
        ? [
            energyOption('از شکاف باریک پیش برو', 'key'),
            energyOption('غنیمت کنار فانوس را بردار', 'search'),
            energyOption('لحظه‌ای گوش بسپار', 'talk'),
          ]
        : [
            energyOption('با تمام توان حمله کن', 'sword'),
            energyOption('طلسم شن را فعال کن', 'spell'),
            energyOption('عقب‌نشینی به سایه', 'retreat'),
          ],
      discovered_item: null,
      toast_message: success ? 'مسیر جدید باز شد' : 'آسیب دیدی!',
    };
  }

  // Turn 2 — هر انتخابِ نوبت اول به تاس می‌رسد: زودترین لحظهٔ «بازی‌وار» بازی.
  // آستانهٔ ۸ عمداً پایین است تا اولین تاس بازیکن معمولاً برد باشد.
  if (turnNumber === 2 || (turnNumber == null && PROLOGUE_FIRST_CHOICES.test(chosen))) {
    return {
      story_text: `${prologueDiceSetup(chosen)}\n\nاین لحظه به بخت تو بند است.`,
      current_location: 'کویر رمل — گودِ شن',
      enemy_line_art_type: 'shadow',
      stats_update: { energy_change: 0 },
      needs_dice_roll: true,
      required_roll_type: 'luck',
      min_roll_success: 8,
      options: [],
      discovered_item: null,
      toast_message: 'بررسی مهارت: اقبال',
    };
  }

  // Turn 4 — بعد از درگیری / انتخاب‌های مرحله ۳ → پیشروی منطقی به‌سوی مرحله ۵ (AI زنده)
  if (
    chosen.includes('حمله') ||
    chosen.includes('طلسم شن') ||
    chosen.includes('عقب‌نشینی') ||
    chosen.includes('شکاف') ||
    chosen.includes('غنیمت') ||
    chosen.includes('گوش بسپار')
  ) {
    const fled = chosen.includes('عقب‌نشینی');
    const usedAmulet = chosen.includes('طلسم شن');
    const tookLoot = chosen.includes('غنیمت');
    return {
      story_text: fled
        ? 'به سایه می‌خزی. نفس آن چیز سنگین‌تر می‌شود، اما تو را از دست می‌دهد. دالانی خنک به عمق غار باز است — و بوی گوگرد قوی‌تر می‌شود.'
        : usedAmulet
          ? 'طلسم شن در مشتت گرم می‌شود. گردی زرین‌رنگ روی گودال می‌پاشد و پنجه رهایت می‌کند. از دهانهٔ غار می‌گذری و به دالانی تاریک می‌رسی.'
          : tookLoot
            ? 'کنار فانوس، شنلی تیره با دوخت مسی پیدا می‌کنی. روی شانه‌ات می‌اندازی — گرم و سنگین است. راه دالان بعدی باز است.'
            : 'آنچه زیر شن بود عقب می‌کشد و در گودی محو می‌شود. راه دالان بعدی باز است؛ از اعماق، پژواک بال‌هایی سنگین به گوش می‌رسد.',
      current_location: fled
        ? 'غار اژدهای تاریکی - دالان سایه'
        : 'غار اژدهای تاریکی - دالان ژرف',
      enemy_line_art_type: 'none',
      stats_update: { xp: 10, gold: fled ? 5 : 15 },
      needs_dice_roll: false,
      required_roll_type: null,
      min_roll_success: null,
      options: [
        energyOption('عمیق‌تر پیش برو', 'search'),
        energyOption('نشانه‌های روی دیوار را بخوان', 'talk'),
        energyOption('کمی استراحت کن و نیرو بگیر', 'shield'),
      ],
      discovered_item: tookLoot
        ? {
            id: 'ash_cloak',
            name: 'شنل خاکستر',
            description: 'پارچه‌ای تیره با دوخت مسی؛ گرمای بدن را نگه می‌دارد.',
            icon: 'cloak',
            equip_slot: 'chest' as const,
          }
        : null,
      toast_message: tookLoot
        ? 'پوشیدنی جدید: شنل خاکستر'
        : fled
          ? 'از چشم نگهبان دور شدی'
          : 'راه ادامه دارد',
    };
  }

  // ادامهٔ اسکریپت آفلاین (وقتی AI زنده در دسترس نیست) — هر انتخاب متن و گزینه‌های تازه می‌سازد
  return lateMockBeat(chosen || userPrompt.slice(0, 40), turnNumber);
}

const LATE_BEATS: Array<{
  match?: RegExp;
  story: (chosen: string, turn: number) => string;
  location: string;
  enemy: AiGameResponse['enemy_line_art_type'];
  options: AiGameResponse['options'];
  toast?: string | null;
}> = [
  {
    match: /ردپا|ردیابی/,
    story: (_chosen, turn) =>
      `نوبت ${turn}: ردپاها را دنبال می‌کنی. شن نرم زیر پا فرومی‌رود و ناگهان به لبه‌ی یک گودال می‌رسی که از آن بوی گوگرد برمی‌خیزد.`,
    location: 'لبهٔ گودال گوگردی',
    enemy: 'shadow',
    options: [
      energyOption('از طناب پوسیده پایین برو', 'key'),
      energyOption('با سنگ کوچک صدا کن', 'talk'),
      energyOption('دور گودال بگرد', 'search'),
    ],
  },
  {
    match: /معبد|ستون/,
    story: (_chosen, turn) =>
      `نوبت ${turn}: پای ستون‌های شکسته می‌ایستی. نقش‌های کهنه روی سنگ نامت را تکرار می‌کنند — انگار معبد تو را می‌شناسد.`,
    location: 'معبد نیمه‌فرو‌رفته',
    enemy: 'desert_spirit',
    options: [
      energyOption('نیایش کوتاهی بخوان', 'spell'),
      energyOption('محراب را بگرد', 'search'),
      energyOption('از سایهٔ ستون‌ها عبور کن', 'retreat'),
    ],
  },
  {
    match: /سایه|استراحت|کمپ|بمان/,
    story: (_chosen, turn) =>
      `نوبت ${turn}: در سایه می‌نشینی. نفس‌ات آرام می‌گیرد، اما از دور زوزه‌ای خشک می‌آید — چیزی در دشت بیدار شده است.`,
    location: 'سایهٔ تپه‌های شنی',
    enemy: 'none',
    options: [
      energyOption('به سمت زوزه برو', 'search'),
      energyOption('آتش کوچکی روشن کن', 'spell'),
      energyOption('خزیدن در شن', 'shield'),
    ],
    toast: 'انرژی‌ات کمی بازمی‌گردد',
  },
  {
    match: /طناب|پایین|گودال/,
    story: (_chosen, turn) =>
      `نوبت ${turn}: طناب در دستت می‌لرزد. در تاریکی گودال، نقطه‌ای سبز می‌درخشد — مثل چشمی که پلک نمی‌زند.`,
    location: 'ژرفای گودال',
    enemy: 'shadow',
    options: [
      energyOption('به سوی نور سبز برو', 'search'),
      energyOption('با شمشیر چوبی‌ات آماده باش', 'sword'),
      energyOption('بالا برگرد', 'retreat'),
    ],
  },
  {
    match: /نیایش|محراب|ستون‌ها/,
    story: (_chosen, turn) =>
      `نوبت ${turn}: هوا سنگین می‌شود. شن‌ها دور پاهایت می‌چرخند و شبحی از پارچه‌های پاره شکل می‌گیرد.`,
    location: 'محراب شن',
    enemy: 'desert_spirit',
    options: [
      energyOption('با شبح سخن بگو', 'talk'),
      energyOption('ضربه‌ای آزمایشی بزن', 'sword'),
      energyOption('طلسم شن را بالا بگیر', 'spell'),
    ],
  },
  {
    match: /زوزه|آتش|خزیدن|شبح|سبز|شمشیر|شکاف|گوش/,
    story: (_chosen, turn) =>
      `نوبت ${turn}: مسیر باریک‌تری باز می‌شود. از شکاف سنگ، نوری ناپایدار می‌گذرد و صدای نفس‌کشی سنگین به گوش می‌رسد — انگار داستان تازه دارد شروع می‌شود.`,
    location: 'شکاف بادگیر',
    enemy: 'none',
    options: [
      energyOption('از شکاف عبور کن', 'key'),
      energyOption('صدا را دنبال کن', 'search'),
      energyOption('کمی گوش بسپار و بعد تصمیم بگیر', 'talk'),
    ],
  },
];

function lateMockBeat(chosen: string, turnNumber?: number): AiGameResponse {
  const turn = turnNumber && turnNumber > 0 ? turnNumber : 5;
  const beat =
    LATE_BEATS.find((b) => b.match && b.match.test(chosen)) ||
    LATE_BEATS[(Math.abs(hashStr(chosen + String(turn))) + turn) % LATE_BEATS.length]!;

  return {
    story_text: beat.story(chosen || 'گام در ناشناخته', turn),
    current_location: beat.location,
    enemy_line_art_type: beat.enemy,
    stats_update: {
      xp: 6 + (turn % 5),
      gold: turn % 2 === 0 ? 8 : 4,
      energy_change: beat.toast ? 1 : 0,
    },
    needs_dice_roll: false,
    required_roll_type: null,
    min_roll_success: null,
    options: beat.options,
    discovered_item: null,
    toast_message: beat.toast ?? null,
  };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

/** First N turns stay on deterministic offline mock; from this turn onward use real AI. */
export { AI_LIVE_FROM_TURN } from './aiPolicy';

export type GenerateGameTurnOptions = {
  /** 1-based turn number (awaken / action / dice). Defaults to live AI when omitted. */
  turnNumber?: number;
};

export type GenerateGameTurnResult = {
  data: AiGameResponse;
  source: 'live' | 'mock';
};

export function shouldUseMockAi(
  settings: RuntimeAiSettings,
  turnNumber?: number,
): boolean {
  if (settings.useMockAi || !settings.openaiApiKey) return true;
  if (turnNumber == null) return false;
  return turnNumber < AI_LIVE_FROM_TURN;
}

export type AiModeInfo = {
  aiMode: 'mock' | 'live';
  /** Why mock is active for the upcoming turn; null when live. */
  aiMockReason: string | null;
};

export function resolveAiMode(
  settings: RuntimeAiSettings,
  turnNumber: number,
): AiModeInfo {
  if (!settings.openaiApiKey) {
    return {
      aiMode: 'mock',
      aiMockReason: 'کلید API تنظیم نشده',
    };
  }
  if (settings.useMockAi) {
    return {
      aiMode: 'mock',
      aiMockReason: 'حالت Mock کامل در تنظیمات فعال است',
    };
  }
  if (turnNumber < AI_LIVE_FROM_TURN) {
    return {
      aiMode: 'mock',
      aiMockReason: `نوبت‌های ۱ تا ${AI_LIVE_FROM_TURN - 1} آفلاین هستند`,
    };
  }
  return { aiMode: 'live', aiMockReason: null };
}

export async function generateGameTurn(
  userPrompt: string,
  options: GenerateGameTurnOptions = {},
): Promise<GenerateGameTurnResult> {
  const settings = await getRuntimeAiSettings();
  if (shouldUseMockAi(settings, options.turnNumber)) {
    return {
      data: mockAi(userPrompt, options.turnNumber),
      source: 'mock',
    };
  }

  const systemPrompt = await getPromptBody('system');
  try {
    const content = await requestLiveCompletion(settings, systemPrompt, userPrompt);
    const parsed = AiResponseSchema.parse(extractJson(content));
    if (parsed.needs_dice_roll) {
      parsed.options = [];
    } else if (!parsed.options.length) {
      throw new Error('AI گزینه‌ای برنگرداند');
    }
    return { data: parsed as AiGameResponse, source: 'live' };
  } catch (err) {
    const detail = formatAiError(err);
    console.error('Live AI failed (no mock fallback):', detail, err);
    throw Object.assign(new Error(detail), { status: 502, aiError: true });
  }
}

async function requestLiveCompletion(
  settings: RuntimeAiSettings,
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const client = getClient(settings);
  const base = {
    model: settings.openaiModel,
    temperature: 0.8,
    messages: [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ],
  };

  // Gemini OpenAI-compat often rejects response_format on some models — retry plain.
  try {
    const withFormat = await client.chat.completions.create({
      ...base,
      response_format: { type: 'json_object' },
    });
    const content = withFormat.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');
    return content;
  } catch (firstErr) {
    console.warn('AI json_object mode failed, retrying without it:', formatAiError(firstErr));
    const plain = await client.chat.completions.create(base);
    const content = plain.choices[0]?.message?.content;
    if (!content) throw firstErr;
    return content;
  }
}

/** Short Persian-friendly error for toast / logs. */
export function formatAiError(err: unknown): string {
  if (!err) return 'خطای نامشخص';
  const e = err as {
    message?: string;
    status?: number;
    code?: string;
    error?: { message?: string; code?: string };
  };
  const raw = e.error?.message || e.message || String(err);
  const status = e.status;
  const lower = raw.toLowerCase();

  if (status === 429 || lower.includes('rate') || lower.includes('quota') || lower.includes('resource_exhausted')) {
    return 'ریت‌لیمیت یا سهمیه مدل پر شده — مدل سبک‌تر یا بعداً دوباره';
  }
  if (status === 401 || status === 403 || lower.includes('api key') || lower.includes('permission')) {
    return 'کلید API نامعتبر یا بدون دسترسی';
  }
  if (lower.includes('response_format') || lower.includes('json_object')) {
    return 'این مدل فرمت JSON را پشتیبانی نکرد';
  }
  if (lower.includes('model') && (lower.includes('not found') || lower.includes('invalid'))) {
    return 'نام مدل نامعتبر است — مدل دیگری انتخاب کنید';
  }
  if (err instanceof z.ZodError) {
    return 'پاسخ AI با قالب بازی جور نبود';
  }
  if (
    err instanceof SyntaxError ||
    lower.includes('after json') ||
    lower.includes('unexpected token')
  ) {
    return 'مدل متن اضافی بعد از JSON برگرداند — دوباره تلاش کنید';
  }
  return raw.replace(/\s+/g, ' ').trim().slice(0, 140);
}

export function resetAiClient(): void {
  client = null;
  clientFingerprint = '';
}
