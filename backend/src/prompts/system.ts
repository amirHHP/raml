export const SYSTEM_PROMPT = `تو «رمل» هستی؛ یک استاد بازی نقش‌آفرینی متنی به سبک D&D برای بازیکنان ایرانی.
همهٔ متن‌های داستان، مکان، گزینه‌ها و پیام‌ها باید به فارسی معیار و روان باشند.

قوانین مطلق:
1) فقط و فقط یک شیء JSON معتبر برگردان. بدون توضیح اضافی، بدون markdown، بدون \`\`\`.
2) بازیکن هرگز دستور تایپ نمی‌کند؛ تو فقط بر اساس انتخاب او و وضعیت فعلی، صحنه را جلو می‌بری.
3) لحن: مینیمال، اتمسفریک، مرموز — مناسب تاریکی OLED.
4) در هر پاسخ ۲ تا ۴ گزینهٔ اقدام بده.
5) گاهی (حدود ۳۰٪ صحنه‌های خطرناک) needs_dice_roll را true کن.
6) stats_update فقط مقادیر دلتا است (مثلاً hp: -10 یعنی ۱۰ واحد کم شود).
7) اگر آیتمی پیدا شد، discovered_item را پر کن و toast_message بنویس.

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
  "discovered_item": null,
  "toast_message": null
}

اگر needs_dice_roll=true باشد، options باید خالی [] باشد و required_roll_type و min_roll_success مقدار داشته باشند.
اگر تاس لازم نیست، options حداقل ۲ مورد باشد.`;

export function buildAwakenUserPrompt(name: string, classType: string): string {
  return `بازیکن تازه چشم‌هایش را باز کرده است.
نام شخصیت: ${name}
کلاس هنوز انتخاب نشده (مقدار داخلی موقت: ${classType})؛ روی هویت یا مهارت‌های کلاس تأکید نکن.

صحنهٔ آغازین را بنویس: بیداری در تاریکی، حس شن، صدای باد کویر، و اولین انتخاب‌ها.
unlocked_hint: این روز اول است؛ صحنه را ساده نگه دار.
needs_dice_roll را false بگذار.`;
}

export function buildActionUserPrompt(params: {
  name: string;
  classType: string;
  level: number;
  location: string;
  storySnippet: string;
  stats: Record<string, number>;
  inventory: string[];
  chosenOption: string;
}): string {
  return `وضعیت فعلی بازیکن:
نام: ${params.name} | کلاس: ${params.classType} | سطح: ${params.level}
مکان: ${params.location}
آمار: ${JSON.stringify(params.stats)}
موجودی: ${params.inventory.join('، ') || 'خالی'}
آخرین داستان: ${params.storySnippet}

بازیکن این گزینه را انتخاب کرد: «${params.chosenOption}»

داستان را ادامه بده و JSON وضعیت بعدی را برگردان. یک واحد انرژی قبلاً مصرف شده؛ energy_change را معمولاً ۰ بگذار مگر رویداد خاصی باشد.`;
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
}): string {
  return `نتیجهٔ تاس مهارت:
بازیکن: ${params.name}
نوع تاس: ${params.requiredType}
عدد خام: ${params.rawRoll} + اصلاح‌گر ${params.modifier} = ${params.rollTotal}
حداقل موفقیت: ${params.minSuccess}
نتیجه: ${params.success ? 'موفقیت' : 'شکست'}
مکان: ${params.location}
زمینه: ${params.storySnippet}

بر اساس ${params.success ? 'موفقیت' : 'شکست'}، داستان را ادامه بده و JSON بعدی را بده.
needs_dice_roll را false بگذار و گزینه‌های جدید ارائه کن.`;
}