import mongoose, { Schema, Document } from 'mongoose';

export type FeedbackCategory = 'general' | 'bug' | 'suggestion' | 'praise';

export interface IFeedback extends Document {
  deviceId: string;
  characterName: string | null;
  category: FeedbackCategory;
  rating: number;
  message: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    deviceId: { type: String, required: true, index: true },
    characterName: { type: String, default: null },
    category: {
      type: String,
      enum: ['general', 'bug', 'suggestion', 'praise'],
      default: 'general',
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const Feedback =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>('Feedback', FeedbackSchema);
