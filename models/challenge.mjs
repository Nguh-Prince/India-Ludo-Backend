import mongoose from "mongoose";
const Schema = mongoose.Schema;

const ChallengeSchema = new Schema({
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  numberOfParticipants: {
    type: Number,
    default: 2,
  },
  participants: [
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true,
      }
    },
  ],
  bet: {
    type: Number,
  },
  totalWinnings: {
    type: Number,
  },
  completed: {
    type: Boolean,
    required: true,
    default: false,
  },
  created: {
    type: Date,
    default: Date.now
  }
});

const Challenge = mongoose.model("Challenge", ChallengeSchema);

export default Challenge;
