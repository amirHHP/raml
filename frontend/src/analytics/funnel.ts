import { api } from '../api/client';

/** Mirrors FUNNEL_EVENT_NAMES in backend/src/models/FunnelEvent.ts. */
export type FunnelEventName =
  | 'app_open'
  | 'name_focused'
  | 'awaken_submitted'
  | 'awaken_complete'
  | 'first_choice'
  | 'first_dice'
  | 'turn_5'
  | 'intro_skipped'
  | 'eyes_skipped'
  | 'story_skipped';

const BOOT_MS = Date.now();
const FLUSH_DELAY_MS = 1500;

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `s-${BOOT_MS}-${Math.random().toString(36).slice(2, 10)}`;
}

const sessionId = newSessionId();
const recorded = new Set<FunnelEventName>();

let enabled = false;
let decided = false;
let queue: Array<{ name: FunnelEventName; atMs: number }> = [];
let flushTimer = 0;

function flush(): void {
  if (flushTimer) {
    window.clearTimeout(flushTimer);
    flushTimer = 0;
  }
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  // Best-effort: a dropped batch costs one data point, a retry loop costs a session.
  void api.sendFunnelEvents(sessionId, batch).catch(() => undefined);
}

/**
 * The funnel answers "of N first-time players, how many reached step X", so
 * returning players must not be counted. Call once, as soon as it is known
 * whether this session started with a brand new player.
 */
export function initFunnel(isFirstSession: boolean): void {
  if (decided) return;
  decided = true;
  enabled = isFirstSession;
  if (!enabled) return;

  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) flush();
  });
}

/** Records a step at most once per session. Safe to call before initFunnel. */
export function track(name: FunnelEventName): void {
  if (!enabled || recorded.has(name)) return;
  recorded.add(name);
  queue.push({ name, atMs: Date.now() - BOOT_MS });
  if (!flushTimer) {
    flushTimer = window.setTimeout(flush, FLUSH_DELAY_MS);
  }
}
