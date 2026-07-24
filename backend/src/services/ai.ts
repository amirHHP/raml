import { z } from 'zod';
import OpenAI from 'openai';
import { config } from '../config';
import { SYSTEM_PROMPT } from '../prompts/system';
import type { AiGameResponse } from '../types/game';

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

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseUrl,
    });
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

/** Deterministic offline AI for local/dev without API keys. */
function mockAi(userPrompt: string): AiGameResponse {
  const isAwaken = userPrompt.includes('چشم‌هایش را باز کرده');
  const isDice = userPrompt.includes('نتیجهٔ تاس');
  const success = userPrompt.includes('نتیجه: موفقیت');

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
        {
          text: 'به سوی نور غار برو',
          icon: 'search',
          condition_check: { stat: 'energy', min: 1 },
        },
        {
          text: 'با باد سخن بگو',
          icon: 'talk',
          condition_check: { stat: 'intellect', min: 1 },
        },
        {
          text: 'شمشیر چوبی‌ات را محکم بگیر',
          icon: 'sword',
          condition_check: { stat: 'strength', min: 1 },
        },
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
      options: [
        {
          text: 'حمله مستقیم',
          icon: 'sword',
          condition_check: { stat: 'strength', min: 1 },
        },
        {
          text: 'پرتاب گلوله آتشین',
          icon: 'spell',
          condition_check: { stat: 'mana', min: 15 },
        },
        {
          text: 'عقب‌نشینی به سایه',
          icon: 'retreat',
          condition_check: { stat: 'agility', min: 1 },
        },
      ],
      discovered_item: null,
      toast_message: success ? 'مسیر جدید باز شد' : 'آسیب دیدی!',
    };
  }

  // Generic action continuation — occasionally request a dice roll
  const wantsDice = /غار|حمله|نگهبان|اژدها/.test(userPrompt) || userPrompt.includes('به سوی نور');

  if (wantsDice && !userPrompt.includes('عقب')) {
    return {
      story_text:
        'وارد تالار ورودی می‌شوی. مجسمه‌ای غول‌پیکر از سنگ سیاه بیدار می‌شود — نگهبان غار. چشمانش چون اخگر می‌درخشند.\n\nبرای عبور، باید قدرت خود را بیازمایی.',
      current_location: 'غار اژدهای تاریکی - تالار ورودی',
      enemy_line_art_type: 'orc_guardian',
      stats_update: { energy_change: 0 },
      needs_dice_roll: true,
      required_roll_type: 'strength',
      min_roll_success: 12,
      options: [],
      discovered_item: null,
      toast_message: 'بررسی مهارت: قدرت',
    };
  }

  return {
    story_text:
      'باد کویر نامت را با خود می‌برد. رد پایی تازه روی شن دیده می‌شود — کسی یا چیزی پیش از تو از اینجا گذشته است.\n\nدر دوردست، ستون‌های شکستهٔ یک معبد نیمه‌فرو‌رفته خودنمایی می‌کنند.',
    current_location: 'دشت شن‌های روان',
    enemy_line_art_type: 'shadow',
    stats_update: { xp: 8, gold: 10 },
    needs_dice_roll: false,
    required_roll_type: null,
    min_roll_success: null,
    options: [
      {
        text: 'ردیابی ردپاها',
        icon: 'search',
        condition_check: { stat: 'agility', min: 1 },
      },
      {
        text: 'ورود به معبد شکسته',
        icon: 'key',
        condition_check: { stat: 'energy', min: 1 },
      },
      {
        text: 'افسون حفاظتی بر خود بکش',
        icon: 'shield',
        condition_check: { stat: 'mana', min: 10 },
      },
      {
        text: 'بازگشت به کمپ',
        icon: 'retreat',
        condition_check: { stat: 'energy', min: 0 },
      },
    ],
    discovered_item: null,
    toast_message: null,
  };
}

export async function generateGameTurn(userPrompt: string): Promise<AiGameResponse> {
  if (config.useMockAi) {
    return mockAi(userPrompt);
  }

  const completion = await getClient().chat.completions.create({
    model: config.openaiModel,
    temperature: 0.8,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  const parsed = AiResponseSchema.parse(extractJson(content));
  return parsed as AiGameResponse;
}