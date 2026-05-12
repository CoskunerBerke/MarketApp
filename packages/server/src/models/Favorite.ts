import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
}

const FavoriteSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });

export default mongoose.model<IFavorite>('Favorite', FavoriteSchema);
