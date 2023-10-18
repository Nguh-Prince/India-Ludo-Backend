import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult, checkSchema } from "express-validator";

import Challenge from "../models/challenge.mjs";
import { loginRequired } from "./authentication.mjs";

const router = express.Router();

const MINIMUM_BET_AMOUNT = 3;
const WINNING_AMOUNT_FRACTION = 0.8; // the fraction of the total amount bet that goes to the winner
// i.e. if 2 players bet 30 coins, the winner should win 60 * WINNING_AMOUNT_FRACTION

router.get("/", loginRequired, async (req, res) => {
  let user = req.user;
  console.log("Getting the list of challenges")

  let query = {
    $or: [{ creatorId: user._id }, { "participants.userId": user._id }],
  };

  console.log("Running query")
  const challenges = await Challenge.find(query);
  
  if (!challenges) {
    return res.status(500).send("Error retrieving challenges")
  }

  console.log(`Query ran successfully`)

  return res.send({
    message: "", data: challenges
  });
});

router.post(
  "/",
  loginRequired,
  body("bet", `Bet must be at least ${MINIMUM_BET_AMOUNT}`).isFloat({
    min: MINIMUM_BET_AMOUNT,
  }),
  async (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
        return res.status(400).send({ errors: result.array() })
    }

    let user = req.user;

    let newChallenge = new Challenge();

    newChallenge.bet = req.body.bet;
    newChallenge.creatorId = user._id;
    newChallenge.participants = [
        {
            userId: user._id
        }
    ]
    newChallenge.totalWinnings = newChallenge.numberOfParticipants * newChallenge.bet * WINNING_AMOUNT_FRACTION;

    newChallenge.save()
    .then( async() => {
        console.log(`Challenge saved successfully`);

        return res.status(200).send({
            message: "Challenge created successfully",
            data: newChallenge
        })
    } ).catch((reason) => {
        console.log(`Error savng the challenge, reason`)
        console.log(reason)

        return res.status(500).send({
            message: "Server error."
        })
    })
  }
);

export default router