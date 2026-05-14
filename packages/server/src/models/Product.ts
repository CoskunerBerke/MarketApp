import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  imageUrl?: string;
  marketId: mongoose.Types.ObjectId;
  categoryId?: mongoose.Types.ObjectId;
  sourceUrl?: string;
  isScraped: boolean;
  price: number;
  oldPrice?: number;
  discountRate?: number;
  promotionPrice?: number;
  promotionText?: string;
  campaignStartDate?: Date;
  campaignEndDate?: Date;
}

const ProductSchema: Schema = new Schema({
  name: { type: String, required: true },
  imageUrl: { type: String },
  marketId: { type: Schema.Types.ObjectId, ref: 'Market', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  sourceUrl: { type: String },
  isScraped: { type: Boolean, default: false },
  price: { type: Number, required: true },
  oldPrice: { type: Number },
  discountRate: { type: Number },
  promotionPrice: { type: Number },
  promotionText: { type: String },
  campaignStartDate: { type: Date },
  campaignEndDate: { type: Date },
}, { timestamps: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
