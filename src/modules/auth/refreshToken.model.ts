import mongoose, { Schema, Document } from 'mongoose';

export interface IRefreshToken extends Document {
  user: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdByIp?: string;
  revokedAt?: Date;
  replacedByToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdByIp: { type: String },
    revokedAt: { type: Date },
    replacedByToken: { type: String },
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
