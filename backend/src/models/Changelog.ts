import mongoose, { Schema, Document } from 'mongoose';

export interface IChangelog extends Document {
  version: string;
  title: string;
  titleEn: string;
  items: string[];
  itemsEn: string[];
  createdAt: Date;
}

const ChangelogSchema = new Schema<IChangelog>(
  {
    version: { type: String, required: true, maxlength: 30 },
    title: { type: String, required: true, maxlength: 200 },
    titleEn: { type: String, default: '', maxlength: 200 },
    items: { type: [String], default: [] },
    itemsEn: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ChangelogSchema.index({ createdAt: -1 });

export const Changelog =
  mongoose.models.Changelog ||
  mongoose.model<IChangelog>('Changelog', ChangelogSchema);
