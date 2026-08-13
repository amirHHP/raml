import { Feedback, type IFeedback, type FeedbackCategory } from '../models/Feedback';

// ── In-memory fallback store ───────────────────────────────────

let useMemory = true;

export function setFeedbackMemory(val: boolean) {
  useMemory = val;
}

interface FeedbackMemEntry {
  _id: string;
  deviceId: string;
  characterName: string | null;
  category: FeedbackCategory;
  rating: number;
  message: string;
  createdAt: Date;
}

let memStore: FeedbackMemEntry[] = [];
let memIdCounter = 1;

// ── Public helpers ─────────────────────────────────────────────

function toPublic(doc: IFeedback | FeedbackMemEntry) {
  return {
    id: String((doc as any)._id ?? (doc as any).id),
    deviceId: doc.deviceId,
    characterName: doc.characterName,
    category: doc.category,
    rating: doc.rating,
    message: doc.message,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
  };
}

// ── Rate limiting (max 3 per device per hour) ──────────────────

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 3;

async function checkRateLimit(deviceId: string): Promise<void> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  let recentCount: number;

  if (useMemory) {
    recentCount = memStore.filter(
      (e) => e.deviceId === deviceId && e.createdAt >= since,
    ).length;
  } else {
    recentCount = await Feedback.countDocuments({
      deviceId,
      createdAt: { $gte: since },
    });
  }

  if (recentCount >= MAX_PER_WINDOW) {
    const err = new Error('لطفاً کمی صبر کنید و بعداً دوباره تلاش کنید') as Error & {
      status?: number;
    };
    err.status = 429;
    throw err;
  }
}

// ── Submit ─────────────────────────────────────────────────────

export async function submitFeedback(data: {
  deviceId: string;
  characterName?: string | null;
  category: FeedbackCategory;
  rating: number;
  message: string;
}) {
  await checkRateLimit(data.deviceId);

  if (useMemory) {
    const entry: FeedbackMemEntry = {
      _id: `mem_fb_${memIdCounter++}`,
      deviceId: data.deviceId,
      characterName: data.characterName || null,
      category: data.category,
      rating: data.rating,
      message: data.message,
      createdAt: new Date(),
    };
    memStore.unshift(entry);
    return toPublic(entry);
  }

  const doc = await Feedback.create({
    deviceId: data.deviceId,
    characterName: data.characterName || null,
    category: data.category,
    rating: data.rating,
    message: data.message,
  });
  return toPublic(doc);
}

// ── List (admin) ──────────────────────────────────────────────

export async function listFeedbacks(options?: {
  page?: number;
  limit?: number;
  category?: FeedbackCategory;
}) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  if (useMemory) {
    let items = [...memStore];
    if (options?.category) {
      items = items.filter((e) => e.category === options.category);
    }
    items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = items.length;
    const paged = items.slice(skip, skip + limit);
    return {
      items: paged.map(toPublic),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  const filter: Record<string, any> = {};
  if (options?.category) {
    filter.category = options.category;
  }

  const [docs, total] = await Promise.all([
    Feedback.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Feedback.countDocuments(filter),
  ]);

  return {
    items: (docs as unknown as IFeedback[]).map(toPublic),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ── Stats (admin) ──────────────────────────────────────────────

export async function getFeedbackStats() {
  if (useMemory) {
    const total = memStore.length;
    const avgRating =
      total > 0
        ? memStore.reduce((sum, e) => sum + e.rating, 0) / total
        : 0;
    const byCategory = {
      general: memStore.filter((e) => e.category === 'general').length,
      bug: memStore.filter((e) => e.category === 'bug').length,
      suggestion: memStore.filter((e) => e.category === 'suggestion').length,
      praise: memStore.filter((e) => e.category === 'praise').length,
    };
    return { total, avgRating: Math.round(avgRating * 10) / 10, byCategory };
  }

  const [total, ratingAgg, categoryCounts] = await Promise.all([
    Feedback.countDocuments(),
    Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    Feedback.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  const avgRating =
    ratingAgg.length > 0 ? Math.round(ratingAgg[0].avg * 10) / 10 : 0;
  const byCategory: Record<string, number> = {
    general: 0,
    bug: 0,
    suggestion: 0,
    praise: 0,
  };
  for (const c of categoryCounts) {
    byCategory[c._id] = c.count;
  }

  return { total, avgRating, byCategory };
}

// ── Delete (admin) ────────────────────────────────────────────

export async function deleteFeedback(id: string) {
  if (useMemory) {
    const idx = memStore.findIndex((e) => e._id === id);
    if (idx === -1) {
      const err = new Error('Feedback not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    memStore.splice(idx, 1);
    return;
  }

  const doc = await Feedback.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Feedback not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
}
