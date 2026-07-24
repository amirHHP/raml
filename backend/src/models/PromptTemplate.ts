import mongoose, { Schema, Document } from 'mongoose';

export const PROMPT_KEYS = ['system', 'awaken', 'action', 'dice'] as const;
export type PromptKey = (typeof PROMPT_KEYS)[number];

export interface IPromptTemplate extends Document {
  key: PromptKey;
  body: string;
  updatedAt: Date;
}

const PromptTemplateSchema = new Schema<IPromptTemplate>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: PROMPT_KEYS,
    },
    body: { type: String, required: true },
  },
  { timestamps: true },
);

export const PromptTemplate =
  mongoose.models.PromptTemplate ||
  mongoose.model<IPromptTemplate>('PromptTemplate', PromptTemplateSchema);
