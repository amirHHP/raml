export const DEFAULT_AWAKEN_TEMPLATE = `بازیکن تازه چشم‌هایش را باز کرده است.
نام شخصیت: {{name}}
کلاس هنوز انتخاب نشده (مقدار داخلی موقت: {{classType}})؛ روی هویت یا مهارت‌های کلاس تأکید نکن.

صحنهٔ آغازین را بنویس: بیداری در تاریکی، حس شن، صدای باد کویر، و اولین انتخاب‌ها.
unlocked_hint: این روز اول است؛ صحنه را ساده نگه دار.
needs_dice_roll را false بگذار.`;

export const DEFAULT_ACTION_TEMPLATE = `وضعیت فعلی بازیکن:
نام: {{name}} | کلاس: {{classType}} | سطح: {{level}}
مکان: {{location}}
آمار: {{stats}}
موجودی: {{inventory}}
خلاصهٔ صحنه‌های اخیر:
{{recentHistory}}
آخرین صحنه: {{storySnippet}}
early_resources: {{earlyResources}}
unlocked_resources: {{unlockedResources}}

بازیکن این گزینه را انتخاب کرد: «{{chosenOption}}»

داستان را از همین نقطه جلو ببر. صحنه یا جملات قبلی را تکرار نکن. مکان یا وضعیت را نسبت به قبل تغییر بده.
یک واحد انرژی قبلاً مصرف شده؛ energy_change را معمولاً ۰ بگذار مگر رویداد خاصی باشد.
اگر early_resources=energy_only است، گزینه‌ها فقط با انرژی (condition_check.stat=energy، min=0) باشند.
فقط منابع داخل unlocked_resources را در stats_update یا شرط گزینه استفاده کن.`;

export const DEFAULT_DICE_TEMPLATE = `نتیجهٔ تاس مهارت:
بازیکن: {{name}}
نوع تاس: {{requiredType}}
عدد خام: {{rawRoll}} + اصلاح‌گر {{modifier}} = {{rollTotal}}
حداقل موفقیت: {{minSuccess}}
نتیجه: {{resultLabel}}
مکان: {{location}}
زمینه: {{storySnippet}}
خلاصهٔ صحنه‌های اخیر:
{{recentHistory}}

بر اساس {{resultLabel}}، داستان را ادامه بده (تکرار صحنهٔ قبل ممنوع) و JSON بعدی را بده.
needs_dice_roll را false بگذار و گزینه‌های جدید ارائه کن.`;

export function renderTemplate(
  template: string,
  vars: Record<string, string | number | boolean>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = vars[key];
    return value == null ? '' : String(value);
  });
}
