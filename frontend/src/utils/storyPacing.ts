/**
 * Pacing of the opening minute. These values are tuned for time-to-first-choice:
 * every extra second here is a second a new player spends unable to act.
 */

/** Reveal speed that stays just ahead of a comfortable Persian reading pace. */
export const DEFAULT_STORY_MS_PER_WORD = 160;

/**
 * Must stay in sync with `--eyes-open-duration` in index.css, which drives the
 * eyelid and globe keyframes.
 */
export const EYES_OPEN_MS = 2400;

/** Grace period before the awakening transition accepts a tap to skip. */
export const EYES_OPEN_SKIPPABLE_AFTER_MS = 900;
