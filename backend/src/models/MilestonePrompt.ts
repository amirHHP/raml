import mongoose, { Schema, Document } from 'mongoose';

/** Milestone prompts fire on story turns that are multiples of this interval. */
export const MILESTONE_INTERVAL = 10;

export interface IMilestonePrompt extends Document {
  /** Story turn number (must be a positive multiple of MILESTONE_INTERVAL). */
  turn: number;
  body: string;
  updatedAt: Date;
}

const MilestonePromptSchema = new Schema<IMilestonePrompt>(
  {
    turn: {
      type: Number,
      required: true,
      unique: true,
      min: MILESTONE_INTERVAL,
      validate: {
        validator: (v: number) => Number.isInteger(v) && v > 0 && v % MILESTONE_INTERVAL === 0,
        message: `turn must be a positive multiple of ${MILESTONE_INTERVAL}`,
      },
    },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

export const MilestonePrompt =
  mongoose.models.MilestonePrompt ||
  mongoose.model<IMilestonePrompt>('MilestonePrompt', MilestonePromptSchema);
