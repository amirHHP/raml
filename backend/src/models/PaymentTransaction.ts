import mongoose, { Schema, Document } from 'mongoose';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface IPaymentTransaction extends Document {
  authority: string;
  amountTomans: number;
  sku: string;
  skuTitle: string;
  deviceId: string;
  status: PaymentStatus;
  refId?: string;
  cardPan?: string;
  cardHash?: string;
  fee?: number;
  gateway: string;
  errorMessage?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    authority: { type: String, required: true, unique: true, index: true },
    amountTomans: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, index: true },
    skuTitle: { type: String, default: '' },
    deviceId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    refId: { type: String, default: '' },
    cardPan: { type: String, default: '' },
    cardHash: { type: String, default: '' },
    fee: { type: Number, default: 0 },
    gateway: { type: String, default: 'zarinpal' },
    errorMessage: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>('PaymentTransaction', PaymentTransactionSchema);
