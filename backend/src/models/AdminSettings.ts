import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminSettings extends Document {
  singletonKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  useMockAi: boolean;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>(
  {
    singletonKey: { type: String, required: true, unique: true, default: 'default' },
    openaiApiKey: { type: String, default: '' },
    openaiBaseUrl: { type: String, default: 'https://api.openai.com/v1' },
    openaiModel: { type: String, default: 'gpt-4o-mini' },
    useMockAi: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const AdminSettings =
  mongoose.models.AdminSettings ||
  mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
