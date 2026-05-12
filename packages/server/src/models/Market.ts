import mongoose, { Schema, Document } from 'mongoose';

export interface IMarket extends Document {
  name: string;
  logoUrl?: string;
  isActive: boolean;
}

const MarketSchema: Schema = new Schema({
  name: { type: String, required: true },
  logoUrl: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IMarket>('Market', MarketSchema);
