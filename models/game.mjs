import mongoose from "mongoose";
const Schema = mongoose.Schema;

const GameSchema = new Schema({
    participants: [
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "user",
                required: true
            }
        }
    ],
    firstIndex: {
        type: number // the index of the first player
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    winner: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
})

const Game = mongoose.model("Game", GameSchema);

export default Game;