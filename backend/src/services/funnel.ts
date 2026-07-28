import {
  FunnelEvent,
  FUNNEL_SIGNALS,
  FUNNEL_STEPS,
  type FunnelEventName,
} from '../models/FunnelEvent';

/** Bounds the dev/in-memory store; production uses Mongo with a TTL. */
const MEMORY_SESSION_LIMIT = 5000;

export type FunnelStepReport = {
  name: FunnelEventName;
  sessions: number;
  /** Share of first-time players that reached this step. */
  reachedPct: number;
  /** Share lost between the previous step and this one. */
  dropPct: number;
};

export type FunnelReport = {
  steps: FunnelStepReport[];
  signals: Array<{ name: FunnelEventName; sessions: number }>;
  /** Milliseconds from app boot to the first action card tap. */
  timeToFirstChoiceMs: { median: number | null; p90: number | null; samples: number };
  memoryStore: boolean;
};

export type IncomingEvent = { name: FunnelEventName; atMs: number };

let useMemory = false;
const memoryEvents = new Map<string, Map<FunnelEventName, number>>();

export function setFunnelMemory(value: boolean): void {
  useMemory = value;
}

export function clearFunnelMemory(): void {
  memoryEvents.clear();
}

/**
 * Idempotent per (session, event): a retried or duplicated beacon must not
 * inflate the funnel.
 */
export async function recordEvents(
  deviceId: string,
  sessionId: string,
  events: IncomingEvent[],
): Promise<void> {
  if (useMemory) {
    let session = memoryEvents.get(sessionId);
    if (!session) {
      if (memoryEvents.size >= MEMORY_SESSION_LIMIT) {
        const oldest = memoryEvents.keys().next().value;
        if (oldest != null) memoryEvents.delete(oldest);
      }
      session = new Map();
      memoryEvents.set(sessionId, session);
    }
    for (const event of events) {
      if (!session.has(event.name)) session.set(event.name, event.atMs);
    }
    return;
  }

  await FunnelEvent.bulkWrite(
    events.map((event) => ({
      updateOne: {
        filter: { sessionId, name: event.name },
        update: {
          $setOnInsert: {
            deviceId,
            sessionId,
            name: event.name,
            atMs: event.atMs,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    })),
    { ordered: false },
  );
}

/** Nearest-rank percentile over a sorted ascending list. */
function percentile(sorted: number[], fraction: number): number | null {
  if (sorted.length === 0) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(fraction * sorted.length) - 1),
  );
  return sorted[index] ?? null;
}

function buildReport(
  counts: Map<FunnelEventName, number>,
  firstChoiceTimings: number[],
  memoryStore: boolean,
): FunnelReport {
  const total = counts.get('app_open') ?? 0;
  let previous = total;

  const steps = FUNNEL_STEPS.map((name) => {
    const sessions = counts.get(name) ?? 0;
    const step: FunnelStepReport = {
      name,
      sessions,
      reachedPct: total > 0 ? Math.round((sessions / total) * 1000) / 10 : 0,
      dropPct:
        previous > 0 ? Math.round(((previous - sessions) / previous) * 1000) / 10 : 0,
    };
    previous = sessions;
    return step;
  });

  const sorted = [...firstChoiceTimings].sort((a, b) => a - b);

  return {
    steps,
    signals: FUNNEL_SIGNALS.map((name) => ({
      name,
      sessions: counts.get(name) ?? 0,
    })),
    timeToFirstChoiceMs: {
      median: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      samples: sorted.length,
    },
    memoryStore,
  };
}

export async function getFunnelReport(): Promise<FunnelReport> {
  if (useMemory) {
    const counts = new Map<FunnelEventName, number>();
    const timings: number[] = [];
    for (const session of memoryEvents.values()) {
      for (const [name, atMs] of session) {
        counts.set(name, (counts.get(name) ?? 0) + 1);
        if (name === 'first_choice') timings.push(atMs);
      }
    }
    return buildReport(counts, timings, true);
  }

  const [grouped, choices] = await Promise.all([
    FunnelEvent.aggregate<{ _id: FunnelEventName; count: number }>([
      { $group: { _id: '$name', count: { $sum: 1 } } },
    ]),
    FunnelEvent.find({ name: 'first_choice' }).select('atMs').lean<{ atMs: number }[]>(),
  ]);

  const counts = new Map<FunnelEventName, number>();
  for (const row of grouped) {
    if (row._id) counts.set(row._id, row.count);
  }

  return buildReport(
    counts,
    choices.map((c) => c.atMs),
    false,
  );
}
