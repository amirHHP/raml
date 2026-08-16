import mongoose, { Schema, Document } from 'mongoose';

export type ShopPackageType = 'consumable' | 'non_consumable';

export type ShopRewardType =
  | 'energy_refill'
  | 'energy_amount'
  | 'gold'
  | 'unlock_full_ui'
  | 'scenario'
  | 'custom';

export interface IShopPackage extends Document {
  sku: string;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  priceTomans: number;
  type: ShopPackageType;
  rewardType: ShopRewardType;
  rewardValue?: number | string;
  badge?: string;
  badgeEn?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopPackageSchema = new Schema<IShopPackage>(
  {
    sku: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    descriptionEn: { type: String, default: '', trim: true },
    priceTomans: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['consumable', 'non_consumable'],
      default: 'consumable',
    },
    rewardType: {
      type: String,
      enum: ['energy_refill', 'energy_amount', 'gold', 'unlock_full_ui', 'scenario', 'custom'],
      default: 'energy_refill',
    },
    rewardValue: { type: Schema.Types.Mixed, default: null },
    badge: { type: String, default: '' },
    badgeEn: { type: String, default: '' },
    icon: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const ShopPackage =
  mongoose.models.ShopPackage ||
  mongoose.model<IShopPackage>('ShopPackage', ShopPackageSchema);
