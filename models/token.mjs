import e from "express";
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: Date.now,
    expires: 3600
  },
  code: {
    type: String,
    required: true
  }
});

const ResetTokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "user",
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // this is the expiry time in seconds
  },
});

const Token = mongoose.model("Token", TokenSchema);
export const ResetToken = mongoose.model("ResetToken", ResetTokenSchema);

export default Token;
