import { z } from 'zod';
import OpenAI from 'openai';
import type { AiGameResponse } from '../types/game';
import {
  getRuntimeAiSettings,
  onAiSettingsChange,
  type RuntimeAiSettings,
} from './aiSettings';
import { getPromptBody } from './promptService';
import { AI_LIVE_FROM_TURN } from './aiPolicy';

const AiResponseSchema = z.object({
  story_text: z.string(),
  current_location: z.string(),
  enemy_line_art_type: z.enum([
    'none',
    'orc_guardian',
    'dragon',
    'skeleton',
    'shadow',
    'desert_spirit',
  ]),
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
  needs_dice_roll: z.boolean(),
  required_roll_type: z
    .enum(['strength', 'agility', 'intellect', 'luck'])
    .nullable()
    .optional(),
  min_roll_success: z.number().nullable().optional(),
  options: z
    .array(
      z.object({
        text: z.string(),
        icon: z.enum(['sword', 'spell', 'key', 'retreat', 'talk', 'search', 'shield']),
        condition_check: z.object({
          stat: z.enum([
            'hp',
            'mana',
            'gold',
            'energy',
            'strength',
            'agility',
            'intellect',
          ]),
          min: z.number(),
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
    })
    .nullable()
    .optional(),
  toast_message: z.string().nullable().optional(),
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

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI response is not valid JSON');
    return JSON.parse(match[0]);
  }
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

  // Turn 1 — بیداری؛ فقط انرژی
  if (isAwaken) {
    return {
      story_text:
        'چشم‌هایت را باز می‌کنی. شن‌های سرد زیر انگشتانت می‌لغزند. افقی از ماهِ رنگ‌پریده، کویر را به دو نیم کرده است.\n\nاز دور، نوری کم‌سو از دهانهٔ غاری می‌درخشد — و صدایی خش‌دار نامت را زمزمه می‌کند.',
      current_location: 'کرانه‌های کویر رمل — آستانه',
      enemy_line_art_type: 'none',
      stats_update: { xp: 5 },
      needs_dice_roll: false,
      required_roll_type: null,
      min_roll_success: null,
      options: [
        energyOption('به سوی نور غار برو', 'search'),
        energyOption('با باد سخن بگو', 'talk'),
        energyOption('اطراف را بپای', 'search'),
      ],
      discovered_item: {
        id: 'sand_amulet',
        name: 'طلسم شن',
        description: 'قطعه‌ای کهنه که گرمای خفیفی دارد.',
        icon: 'amulet',
      },
      toast_message: 'آیتم جدید: طلسم شن',
    };
  }

  // Turn 3 — نتیجهٔ تاس نگهبان؛ گزینه‌ها فقط انرژی (نه مانا/قدرت/چابکی)
  if (isDice) {
    return {
      story_text: success
        ? 'تاس به نفع تو می‌چرخد. ضربه‌ات دقیق فرود می‌آید و نگهبان یک قدم عقب می‌رود. راهی باریک به تالار بعدی باز می‌شود.'
        : 'تاس علیه توست. پنجهٔ سنگی به شانه‌ات می‌خورد و نفس‌ات در سینه حبس می‌شود. باید سریع تصمیم بگیری.',
      current_location: 'غار اژدهای تاریکی - تالار ورودی',
      enemy_line_art_type: 'orc_guardian',
      stats_update: success
        ? { xp: 15, gold: 25 }
        : { hp: -12, xp: 5 },
      needs_dice_roll: false,
      required_roll_type: null,
      min_roll_success: null,
      options: success
        ? [
            energyOption('از شکاف باریک پیش برو', 'key'),
            energyOption('غنیمت کنار مجسمه را بردار', 'search'),
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

  // Turn 2 — ورود به غار → تاس بخت (آمار پنهان قدرت را جلو نمی‌آوریم)
  if (
    chosen.includes('به سوی نور') ||
    chosen.includes('نور غار') ||
    chosen.includes('ورود به غار')
  ) {
    return {
      story_text:
        'وارد تالار ورودی می‌شوی. مجسمه‌ای غول‌پیکر از سنگ سیاه بیدار می‌شود — نگهبان غار. چشمانش چون اخگر می‌درخشند.\n\nبرای عبور، باید اقبال خود را بیازمایی.',
      current_location: 'غار اژدهای تاریکی - تالار ورودی',
      enemy_line_art_type: 'orc_guardian',
      stats_update: { energy_change: 0 },
      needs_dice_roll: true,
      required_roll_type: 'luck',
      min_roll_success: 12,
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
    return {
      story_text: fled
        ? 'به سایه می‌خزی. نفس نگهبان سنگین‌تر می‌شود، اما تو را از دست می‌دهد. دالانی خنک به عمق غار باز است — و بوی گوگرد قوی‌تر می‌شود.'
        : usedAmulet
          ? 'طلسم شن در مشتت گرم می‌شود. گردی زرین‌رنگ چشم نگهبان را می‌پوشاند. تا گیج است، از کنارش می‌گذری و به دالانی تاریک می‌رسی.'
          : 'نگهبان سنگی تلوتلو می‌خورد و روی یک زانو می‌افتد. راه تالار بعدی باز است؛ از اعماق، پژواک بال‌هایی سنگین به گوش می‌رسد.',
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
      discovered_item: null,
      toast_message: fled ? 'از چشم نگهبان دور شدی' : 'راه ادامه دارد',
    };
  }

  // شاخه‌های فرعی بیداری → هنوز به غار ختم می‌شوند
  if (chosen.includes('باد') || chosen.includes('اطراف')) {
    return {
      story_text: chosen.includes('باد')
        ? 'باد نامت را زمزمه می‌کند و شن‌ها را به سمت دهانهٔ غار می‌راند. انگار چیزی آنجا منتظرت است.'
        : 'روی شن رد پایی تازه می‌بینی — به سوی همان نور کم‌سو می‌رود. هوا بوی سنگ خیس می‌دهد.',
      current_location: 'کرانه‌های کویر رمل — آستانه',
      enemy_line_art_type: 'none',
      stats_update: { xp: 5 },
      needs_dice_roll: false,
      required_roll_type: null,
      min_roll_success: null,
      options: [
        energyOption('به سوی نور غار برو', 'search'),
        energyOption('همان‌جا کمین کن', 'shield'),
        energyOption('بازگشت به تاریکی امن', 'retreat'),
      ],
      discovered_item: null,
      toast_message: null,
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
    story: (chosen, turn) =>
      `نوبت ${turn}: ردپاها را دنبال می‌کنی. شن نرم زیر پا فرومی‌رود و ناگهان به لبه‌ی یک گودال می‌رسی که از آن بوی گوگرد برمی‌خیزد.\n\n(انتخاب: ${chosen})`,
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
    story: (chosen, turn) =>
      `نوبت ${turn}: پای ستون‌های شکسته می‌ایستی. نقش‌های کهنه روی سنگ نامت را تکرار می‌کنند — انگار معبد تو را می‌شناسد.\n\n(انتخاب: ${chosen})`,
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
    story: (chosen, turn) =>
      `نوبت ${turn}: در سایه می‌نشینی. نفس‌ات آرام می‌گیرد، اما از دور زوزه‌ای خشک می‌آید — چیزی در دشت بیدار شده است.\n\n(انتخاب: ${chosen})`,
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
    story: (chosen, turn) =>
      `نوبت ${turn}: طناب در دستت می‌لرزد. در تاریکی گودال، نقطه‌ای سبز می‌درخشد — مثل چشمی که پلک نمی‌زند.\n\n(انتخاب: ${chosen})`,
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
    story: (chosen, turn) =>
      `نوبت ${turn}: هوا سنگین می‌شود. شن‌ها دور پاهایت می‌چرخند و شبحی از پارچه‌های پاره شکل می‌گیرد.\n\n(انتخاب: ${chosen})`,
    location: 'محراب شن',
    enemy: 'desert_spirit',
    options: [
      energyOption('با شبح سخن بگو', 'talk'),
      energyOption('ضربه‌ای آزمایشی بزن', 'sword'),
      energyOption('طلسم شن را بالا بگیر', 'spell'),
    ],
  },
  {
    match: /زوزه|آتش|خزیدن|شبح|سبز|شمشیر/,
    story: (chosen, turn) =>
      `نوبت ${turn}: مسیر باریک‌تری باز می‌شود. از شکاف سنگ، نوری ناپایدار می‌گذرد و صدای نفس‌کشی سنگین به گوش می‌رسد — انگار داستان تازه دارد شروع می‌شود.\n\n(انتخاب: ${chosen})`,
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
    LATE_BEATS[(Math.abs(hashStr(chosen)) + turn) % LATE_BEATS.length]!;

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
    toast_message:
      beat.toast ??
      (turn >= 5
        ? 'هنوز حالت آفلاین (Mock) است — برای داستان زنده، کلید AI را در ادمین تنظیم کنید'
        : null),
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
): Promise<AiGameResponse> {
  const settings = await getRuntimeAiSettings();
  if (shouldUseMockAi(settings, options.turnNumber)) {
    return mockAi(userPrompt, options.turnNumber);
  }

  const systemPrompt = await getPromptBody('system');
  try {
    const completion = await getClient(settings).chat.completions.create({
      model: settings.openaiModel,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const parsed = AiResponseSchema.parse(extractJson(content));
    return parsed as AiGameResponse;
  } catch (err) {
    console.error('Live AI failed — falling back to mock:', err);
    const fallback = mockAi(userPrompt, options.turnNumber);
    return {
      ...fallback,
      toast_message:
        fallback.toast_message ||
        'ارتباط با AI برقرار نشد؛ ادامه با حالت آفلاین',
    };
  }
}

export function resetAiClient(): void {
  client = null;
  clientFingerprint = '';
}
