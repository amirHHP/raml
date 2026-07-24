import {
  MilestonePrompt,
  MILESTONE_INTERVAL,
} from '../models/MilestonePrompt';

export { MILESTONE_INTERVAL };

export type MilestonePromptItem = {
  turn: number;
  body: string;
  updatedAt: string | null;
};

/** Default milestone directives for turns 10…100 (every 10). */
export const DEFAULT_MILESTONE_BODIES: Record<number, string> = {
  [10]: `در این نوبت بازیکن باید حداقل یک آیتم پیدا کند.
حتماً فیلد discovered_item را با یک آیتم مناسب صحنه پر کن تا در کوله‌پشتی ذخیره شود.
آیتم باید نام، توضیح کوتاه، آیکون و id یکتا داشته باشد.`,

  [20]: `این نوبت نقطهٔ آشنایی با بدن و بقاست.
در داستان به آسیب یا خستگی اشاره کن و در stats_update حداقل یک تغییر روی hp بگذار (مثبت یا منفی، غیرصفر).
گزینه‌ها حس خطر یا مراقبت از جان داشته باشند.`,

  [30]: `منبع یا ردی از نیرو/جادو ظاهر شود.
در stats_update مقدار mana را تغییر بده (غیرصفر) و در داستان حس جریان مانا را نشان بده.
اگر مناسب است یک گزینهٔ مرتبط با مانا پیشنهاد کن.`,

  [40]: `بازیکن باید طلا یا غنیمت پیدا کند.
در stats_update مقدار gold را مثبت و غیرصفر بگذار و در toast_message به طلا اشاره کن.
صحنه حس معامله، گنج، یا پاداش داشته باشد.`,

  [50]: `یک رویارویی جدی (دشمن، مانع، یا آزمون) بساز.
needs_dice_roll را true کن و required_roll_type و min_roll_success را منطقی تنظیم کن.
فضا را پرتنش نگه دار؛ گزینه‌ها را خالی [] بگذار.`,

  [60]: `یک آیتم کمیاب یا خاص پیدا شود.
discovered_item را حتماً پر کن (id یکتا، نام متمایز، توضیح کوتاه).
آیتم باید با مسیر داستان هم‌خوان باشد و toast_message داشته باشد.`,

  [70]: `یک دوراهی اخلاقی یا استراتژیک مهم بساز.
۲ تا ۴ گزینه بده که پیامدهای متفاوت واضحی داشته باشند (پیشروی، مذاکره، فداکاری، فرار).
داستان را یک گام تازه جلو ببر؛ صحنهٔ قبل را تکرار نکن.`,

  [80]: `ورود یک هم‌پیمان، دشمن پنهان، یا خیانت احتمالی.
رابطهٔ تازه‌ای در داستان معرفی کن و حداقل یکی از stats_update (hp/mana/gold/xp) را غیرصفر بگذار.
لحن مرموز و مبهم بماند.`,

  [90]: `پیش‌نمایش اوج داستان / تهدید بزرگ‌تر.
نشانه‌ای از مقصد نهایی، دشمن اصلی، یا راز کویر بده.
فضا را سنگین‌تر کن و حداقل یک گزینهٔ پیشروی پرریسک داشته باش.`,

  [100]: `اوج موقت یا پاداش افسانه‌ای این فصل.
حتماً discovered_item با آیتم ویژه پر کن و در stats_update ترکیبی از پاداش (مثلاً gold و xp یا mana) بده.
صحنه حس دستاورد داشته باشد ولی درِ ادامهٔ سفر را باز بگذار.`,
};

/** In-memory fallback when Mongo is unavailable. */
const memoryMilestones = new Map<number, string>(
  Object.entries(DEFAULT_MILESTONE_BODIES).map(([k, v]) => [Number(k), v]),
);

let useMemory = false;

export function setMilestonePromptMemory(value: boolean): void {
  useMemory = value;
}

export function isMilestoneTurn(turn: number): boolean {
  return Number.isInteger(turn) && turn > 0 && turn % MILESTONE_INTERVAL === 0;
}

export function assertMilestoneTurn(turn: number): void {
  if (!isMilestoneTurn(turn)) {
    throw Object.assign(
      new Error(`شماره مرحله باید مضرب ${MILESTONE_INTERVAL} باشد (مثل ۱۰، ۲۰، ۳۰)`),
      { status: 400 },
    );
  }
}

export async function ensureMilestoneSeeds(): Promise<void> {
  if (useMemory) {
    for (const [turn, body] of Object.entries(DEFAULT_MILESTONE_BODIES)) {
      const t = Number(turn);
      if (!memoryMilestones.has(t)) memoryMilestones.set(t, body);
    }
    return;
  }

  for (const [turn, body] of Object.entries(DEFAULT_MILESTONE_BODIES)) {
    await MilestonePrompt.updateOne(
      { turn: Number(turn) },
      { $setOnInsert: { turn: Number(turn), body } },
      { upsert: true },
    );
  }
}

export async function listMilestonePrompts(): Promise<MilestonePromptItem[]> {
  if (useMemory) {
    return [...memoryMilestones.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([turn, body]) => ({ turn, body, updatedAt: null }));
  }

  const docs = await MilestonePrompt.find().sort({ turn: 1 }).lean();
  return docs.map((d) => ({
    turn: d.turn,
    body: d.body,
    updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : null,
  }));
}

export async function getMilestonePromptBody(turn: number): Promise<string | null> {
  if (!isMilestoneTurn(turn)) return null;

  if (useMemory) {
    if (memoryMilestones.has(turn)) return memoryMilestones.get(turn)!;
    return DEFAULT_MILESTONE_BODIES[turn] ?? null;
  }

  const doc = await MilestonePrompt.findOne({ turn }).lean<{ body: string } | null>();
  if (doc?.body) return doc.body;
  return DEFAULT_MILESTONE_BODIES[turn] ?? null;
}

export async function upsertMilestonePrompt(
  turn: number,
  body: string,
): Promise<MilestonePromptItem> {
  assertMilestoneTurn(turn);
  const trimmed = body.trim();
  if (!trimmed) {
    throw Object.assign(new Error('متن پرامپت خالی است'), { status: 400 });
  }

  if (useMemory) {
    memoryMilestones.set(turn, trimmed);
    return { turn, body: trimmed, updatedAt: new Date().toISOString() };
  }

  const doc = await MilestonePrompt.findOneAndUpdate(
    { turn },
    { turn, body: trimmed },
    { upsert: true, new: true },
  );

  return {
    turn: doc.turn,
    body: doc.body,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function deleteMilestonePrompt(turn: number): Promise<void> {
  assertMilestoneTurn(turn);

  if (useMemory) {
    memoryMilestones.delete(turn);
    return;
  }

  await MilestonePrompt.deleteOne({ turn });
}

/** Append milestone directive to a user prompt when this turn has one. */
export async function withMilestonePrompt(
  userPrompt: string,
  turnNumber: number,
): Promise<string> {
  const milestone = await getMilestonePromptBody(turnNumber);
  if (!milestone) return userPrompt;

  return `${userPrompt}

———
دستور ویژهٔ مرحله ${turnNumber} (اجباری — اولویت بالاتر از بقیهٔ دستورات این نوبت):
${milestone}`;
}
