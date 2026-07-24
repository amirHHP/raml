import {
  DEFAULT_ACTION_TEMPLATE,
  DEFAULT_AWAKEN_TEMPLATE,
  DEFAULT_DICE_TEMPLATE,
  renderTemplate,
} from './templates';

export const SYSTEM_PROMPT = `تو «رمل» هستی؛ یک استاد بازی نقش‌آفرینی متنی به سبک D&D برای بازیکنان ایرانی.
همهٔ متن‌های داستان، مکان، گزینه‌ها و پیام‌ها باید به فارسی معیار و روان باشند.

قوانین مطلق:
1) فقط و فقط یک شیء JSON معتبر برگردان. بدون توضیح اضافی، بدون markdown، بدون \`\`\`.
2) بازیکن هرگز دستور تایپ نمی‌کند؛ تو فقط بر اساس انتخاب او و وضعیت فعلی، صحنه را جلو می‌بری.
3) لحن: مینیمال، اتمسفریک، مرموز — مناسب تاریکی OLED.
4) در هر پاسخ ۲ تا ۴ گزینهٔ اقدام بده.
5) گاهی (حدود ۳۰٪ صحنه‌های خطرناک) needs_dice_roll را true کن.
6) stats_update فقط مقادیر دلتا است (مثلاً hp: -10 یعنی ۱۰ واحد کم شود).
7) اگر آیتمی پیدا شد، discovered_item را پر کن و toast_message بنویس. اگر پوشیدنی است (کلاه، زره، دستکش، شلوار، کفش، سلاح، زیور)، equip_slot را یکی از head|chest|hands|legs|feet|weapon|accessory بگذار؛ وگرنه null.
8) اگر در پرامپت early_resources=energy_only بود، همهٔ گزینه‌ها فقط condition_check با stat=energy و min=0 داشته باشند (هزینه از energy_cost است). مانا، قدرت، چابکی یا خرد را شرط قفل گزینه نکن.
8b) فقط منابع فهرست‌شده در unlocked_resources را در stats_update تغییر بده یا به‌عنوان شرط گزینه استفاده کن؛ بقیه را ۰ بگذار.
9) صحنه‌های قبلی را تکرار نکن؛ هر پاسخ باید داستان را یک گام تازه جلو ببرد (مکان تازه، رویداد تازه، یا کشف تازه).

ساختار دقیق JSON:
{
  "story_text": "متن داستان فارسی",
  "current_location": "نام مکان فارسی",
  "enemy_line_art_type": "none|orc_guardian|dragon|skeleton|shadow|desert_spirit",
  "stats_update": { "hp": 0, "mana": 0, "gold": 0, "energy_change": 0, "xp": 0 },
  "needs_dice_roll": false,
  "required_roll_type": null,
  "min_roll_success": null,
  "options": [
    {
      "text": "متن گزینه",
      "icon": "sword|spell|key|retreat|talk|search|shield",
      "condition_check": { "stat": "mana|hp|gold|energy|strength|agility|intellect", "min": 0 }
    }
  ],
  "discovered_item": {
    "id": "item_id",
    "name": "نام",
    "description": "توضیح",
    "icon": "icon_key",
    "equip_slot": null
  },
  "toast_message": null
}

discovered_item می‌تواند null باشد. equip_slot فقط برای پوشیدنی‌ها پر شود.

اگر needs_dice_roll=true باشد، options باید خالی [] باشد و required_roll_type و min_roll_success مقدار داشته باشند.
اگر تاس لازم نیست، options حداقل ۲ مورد باشد.`;

export function buildAwakenUserPrompt(name: string, classType: string): string {
  return renderTemplate(DEFAULT_AWAKEN_TEMPLATE, { name, classType });
}

export function buildActionUserPrompt(params: {
  name: string;
  classType: string;
  level: number;
  location: string;
  storySnippet: string;
  recentHistory?: string;
  stats: Record<string, number>;
  inventory: string[];
  chosenOption: string;
  earlyResources?: 'energy_only' | 'partial' | 'full';
  unlockedResources?: string;
}): string {
  return renderTemplate(DEFAULT_ACTION_TEMPLATE, {
    name: params.name,
    classType: params.classType,
    level: params.level,
    location: params.location,
    stats: JSON.stringify(params.stats),
    inventory: params.inventory.join('، ') || 'خالی',
    storySnippet: params.storySnippet,
    recentHistory: params.recentHistory || '—',
    chosenOption: params.chosenOption,
    earlyResources: params.earlyResources ?? 'full',
    unlockedResources: params.unlockedResources ?? 'energy,hp,mana,gold',
  });
}

export function buildDiceResultUserPrompt(params: {
  name: string;
  rollTotal: number;
  rawRoll: number;
  modifier: number;
  requiredType: string;
  minSuccess: number;
  success: boolean;
  location: string;
  storySnippet: string;
  recentHistory?: string;
}): string {
  return renderTemplate(DEFAULT_DICE_TEMPLATE, {
    name: params.name,
    requiredType: params.requiredType,
    rawRoll: params.rawRoll,
    modifier: params.modifier,
    rollTotal: params.rollTotal,
    minSuccess: params.minSuccess,
    resultLabel: params.success ? 'موفقیت' : 'شکست',
    location: params.location,
    storySnippet: params.storySnippet,
    recentHistory: params.recentHistory || '—',
  });
}
