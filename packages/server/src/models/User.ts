import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  resetPasswordAttempts?: number;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  // HMAC of the 6-digit reset code (never the plain code)
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  resetPasswordAttempts: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
