import mongoose, { Schema, Document } from 'mongoose';

/**
 * Onboarding funnel events. Only recorded for sessions that began with a brand
 * new player, so counts read as "of N first-time players, how many reached X".
 */
export const FUNNEL_EVENT_NAMES = [
  'app_open',
  'name_focused',
  'awaken_submitted',
  'awaken_complete',
  'first_choice',
  'first_dice',
  'turn_5',
  'intro_skipped',
  'eyes_skipped',
  'story_skipped',
] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

/** Ordered steps that make up the drop-off report. */
export const FUNNEL_STEPS: readonly FunnelEventName[] = [
  'app_open',
  'name_focused',
  'awaken_submitted',
  'awaken_complete',
  'first_choice',
  'first_dice',
  'turn_5',
];

/** Unordered diagnostics: how often players cut an animation short. */
export const FUNNEL_SIGNALS: readonly FunnelEventName[] = [
  'intro_skipped',
  'eyes_skipped',
  'story_skipped',
];

export interface IFunnelEvent extends Document {
  deviceId: string;
  sessionId: string;
  name: FunnelEventName;
  /** Milliseconds between app boot and the event, so device clocks don't matter. */
  atMs: number;
  createdAt: Date;
}

const FunnelEventSchema = new Schema<IFunnelEvent>(
  {
    deviceId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    name: { type: String, enum: FUNNEL_EVENT_NAMES, required: true },
    atMs: { type: Number, required: true },
    // Raw events are only useful while the funnel is being tuned.
    createdAt: { type: Date, default: Date.now, expires: '90d' },
  },
  { versionKey: false },
);

// One row per step per session keeps counting a plain countDocuments.
FunnelEventSchema.index({ sessionId: 1, name: 1 }, { unique: true });
FunnelEventSchema.index({ name: 1, createdAt: -1 });

export const FunnelEvent =
  mongoose.models.FunnelEvent ||
  mongoose.model<IFunnelEvent>('FunnelEvent', FunnelEventSchema);
