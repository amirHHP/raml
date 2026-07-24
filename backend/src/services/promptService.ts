import {
  PromptTemplate,
  PROMPT_KEYS,
  type PromptKey,
} from '../models/PromptTemplate';
import { SYSTEM_PROMPT } from '../prompts/system';
import {
  DEFAULT_ACTION_TEMPLATE,
  DEFAULT_AWAKEN_TEMPLATE,
  DEFAULT_DICE_TEMPLATE,
  renderTemplate,
} from '../prompts/templates';

const DEFAULT_BODIES: Record<PromptKey, string> = {
  system: SYSTEM_PROMPT,
  awaken: DEFAULT_AWAKEN_TEMPLATE,
  action: DEFAULT_ACTION_TEMPLATE,
  dice: DEFAULT_DICE_TEMPLATE,
};

/** In-memory fallback when Mongo is unavailable. */
const memoryPrompts = new Map<PromptKey, string>(
  PROMPT_KEYS.map((key) => [key, DEFAULT_BODIES[key]]),
);

let useMemory = false;

export function setPromptServiceMemory(value: boolean): void {
  useMemory = value;
}

export async function ensurePromptSeeds(): Promise<void> {
  if (useMemory) {
    for (const key of PROMPT_KEYS) {
      if (!memoryPrompts.has(key)) memoryPrompts.set(key, DEFAULT_BODIES[key]);
    }
    return;
  }

  for (const key of PROMPT_KEYS) {
    await PromptTemplate.updateOne(
      { key },
      { $setOnInsert: { key, body: DEFAULT_BODIES[key] } },
      { upsert: true },
    );
  }
}

export async function getPromptBody(key: PromptKey): Promise<string> {
  if (useMemory) {
    return memoryPrompts.get(key) || DEFAULT_BODIES[key];
  }

  const doc = await PromptTemplate.findOne({ key }).lean<{ body: string } | null>();
  return doc?.body || DEFAULT_BODIES[key];
}

export async function listPrompts(): Promise<
  Array<{ key: PromptKey; body: string; updatedAt: string | null }>
> {
  await ensurePromptSeeds();

  if (useMemory) {
    return PROMPT_KEYS.map((key) => ({
      key,
      body: memoryPrompts.get(key) || DEFAULT_BODIES[key],
      updatedAt: null,
    }));
  }

  const docs = await PromptTemplate.find({ key: { $in: [...PROMPT_KEYS] } }).lean();
  const byKey = new Map(docs.map((d) => [d.key as PromptKey, d]));

  return PROMPT_KEYS.map((key) => {
    const doc = byKey.get(key);
    return {
      key,
      body: doc?.body || DEFAULT_BODIES[key],
      updatedAt: doc?.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    };
  });
}

export async function updatePrompt(
  key: PromptKey,
  body: string,
): Promise<{ key: PromptKey; body: string; updatedAt: string }> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw Object.assign(new Error('متن پرامپت خالی است'), { status: 400 });
  }

  if (useMemory) {
    memoryPrompts.set(key, trimmed);
    return { key, body: trimmed, updatedAt: new Date().toISOString() };
  }

  const doc = await PromptTemplate.findOneAndUpdate(
    { key },
    { key, body: trimmed },
    { upsert: true, new: true },
  );

  return {
    key,
    body: doc.body,
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function buildAwakenPrompt(name: string, classType: string): Promise<string> {
  const template = await getPromptBody('awaken');
  return renderTemplate(template, { name, classType });
}

export async function buildActionPrompt(params: {
  name: string;
  classType: string;
  level: number;
  location: string;
  storySnippet: string;
  stats: Record<string, number>;
  inventory: string[];
  chosenOption: string;
  earlyResources?: 'energy_only' | 'full';
}): Promise<string> {
  const earlyResources = params.earlyResources ?? 'full';
  const template = await getPromptBody('action');
  const rendered = renderTemplate(template, {
    name: params.name,
    classType: params.classType,
    level: params.level,
    location: params.location,
    stats: JSON.stringify(params.stats),
    inventory: params.inventory.join('، ') || 'خالی',
    storySnippet: params.storySnippet,
    chosenOption: params.chosenOption,
    earlyResources,
  });

  if (earlyResources !== 'energy_only') return rendered;

  // Ensure the constraint is present even if a stored template omits {{earlyResources}}.
  if (rendered.includes('early_resources: energy_only')) return rendered;
  return `${rendered}\n\nearly_resources: energy_only\nگزینه‌ها فقط با انرژی (condition_check.stat=energy، min=0) باشند.`;
}

export async function buildDicePrompt(params: {
  name: string;
  rollTotal: number;
  rawRoll: number;
  modifier: number;
  requiredType: string;
  minSuccess: number;
  success: boolean;
  location: string;
  storySnippet: string;
}): Promise<string> {
  const template = await getPromptBody('dice');
  return renderTemplate(template, {
    name: params.name,
    requiredType: params.requiredType,
    rawRoll: params.rawRoll,
    modifier: params.modifier,
    rollTotal: params.rollTotal,
    minSuccess: params.minSuccess,
    resultLabel: params.success ? 'موفقیت' : 'شکست',
    location: params.location,
    storySnippet: params.storySnippet,
  });
}
