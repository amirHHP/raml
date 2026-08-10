import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminSettings extends Document {
  singletonKey: string;
  openaiApiKey: string;
  openaiBaseUrl: string;
  openaiModel: string;
  useMockAi: boolean;
  /** Milliseconds per word for story typewriter (lower = faster). */
  storyMsPerWord: number;
  /** Story turn when backpack tab unlocks. */
  unlockInventoryAtTurn: number;
  /** Story turn when stats tab unlocks. */
  unlockStatsAtTurn: number;
  /** Story turn when HP is shown and may change. */
  unlockHpAtTurn: number;
  /** Story turn when mana is shown and may change. */
  unlockManaAtTurn: number;
  /** Story turn when gold is shown and may change. */
  unlockGoldAtTurn: number;
  /** Gold reward granted to referrer when referee awakens. */
  referralRewardReferrerGold: number;
  /** Gold reward granted to referee when awakening with referral code. */
  referralRewardRefereeGold: number;
  updatedAt: Date;
}

const AdminSettingsSchema = new Schema<IAdminSettings>(
  {
    singletonKey: { type: String, required: true, unique: true, default: 'default' },
    openaiApiKey: { type: String, default: '' },
    openaiBaseUrl: { type: String, default: 'https://api.openai.com/v1' },
    openaiModel: { type: String, default: 'gpt-4o-mini' },
    useMockAi: { type: Boolean, default: true },
    storyMsPerWord: { type: Number, default: 400 },
    unlockInventoryAtTurn: { type: Number, default: 10 },
    unlockStatsAtTurn: { type: Number, default: 20 },
    unlockHpAtTurn: { type: Number, default: 20 },
    unlockManaAtTurn: { type: Number, default: 30 },
    unlockGoldAtTurn: { type: Number, default: 40 },
    referralRewardReferrerGold: { type: Number, default: 50 },
    referralRewardRefereeGold: { type: Number, default: 25 },
  },
  { timestamps: true },
);

export const AdminSettings =
  mongoose.models.AdminSettings ||
  mongoose.model<IAdminSettings>('AdminSettings', AdminSettingsSchema);
