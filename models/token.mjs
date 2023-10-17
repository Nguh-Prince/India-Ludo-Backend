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
  },
});

const Token = mongoose.model("Token", TokenSchema);

export default Token