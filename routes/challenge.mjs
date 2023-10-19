import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult, param } from "express-validator";

import Challenge from "../models/challenge.mjs";
import { loginRequired } from "./authentication.mjs";
import { sendNewChallenge } from "../utils/socket-io.mjs";

const router = express.Router();

const MINIMUM_BET_AMOUNT = 3;
const WINNING_AMOUNT_FRACTION = 0.8; // the fraction of the total amount bet that goes to the winner
// i.e. if 2 players bet 30 coins, the winner should win 60 * WINNING_AMOUNT_FRACTION

router.get("/", loginRequired, async (req, res) => {
  let user = req.user;

  let all = "all" in req.query; // pass this in query params if you want to select all the challenges, by default selects

  console.log("Getting the list of challenges");

  let query = {
    $or: [{ creatorId: user._id }, { "participants.userId": user._id }],
  };

  if (!all) {
    // get only challenges that are not completed and are not yet full i.e. number of participants have not registered
    query.completed = false;
    // query.$where = function () {
    //   return 'this.participants.length' >= 'this.numberOfParticipants'
    // }
  }

  console.log("Running query");

  let challenges = await Challenge.find(query);

  // if (!all) {
  //   challenges.merge({ $where: function() {
  //     return this.participants.length < this.numberOfParticipants
  //   } })
  // }

  if (!challenges) {
    return res.status(500).send("Error retrieving challenges");
  }

  console.log(`Query ran successfully`);

  return res.send({
    message: "",
    data: challenges,
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
      return res.status(400).send({ errors: result.array() });
    }

    let user = req.user;

    let newChallenge = new Challenge();

    newChallenge.bet = req.body.bet;
    newChallenge.creatorId = user._id;
    newChallenge.participants = [
      {
        userId: user._id,
      },
    ];
    newChallenge.totalWinnings =
      newChallenge.numberOfParticipants *
      newChallenge.bet *
      WINNING_AMOUNT_FRACTION;

    newChallenge.populate("creatorId")

    newChallenge
      .save()
      .then(async (value) => {
        value = await value.populate("creatorId");

        console.log(`Challenge saved successfully, broadcasting: `);
        console.log(value);

        sendNewChallenge(value);

        return res.status(200).send({
          message: "Challenge created successfully",
          data: value,
        });
      })
      .catch((reason) => {
        console.log(`Error savng the challenge, reason`);
        console.log(reason);

        return res.status(500).send({
          message: "Server error.",
        });
      });
  }
);

router.post(
  "/:id/join",
  loginRequired,
  param("id").isMongoId().custom(async (value) => {
    let challenge = await Challenge.findById(value);

    if (!challenge) {
      throw new Error(`No challenge exists with this id: ${value}`)
    }

    if (challenge.participants.length >= challenge.numberOfParticipants) {
      throw new Error(`The challenge already has the required number of participants`);
    }
  }),
  async (req, res) => {
    let result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).json({errors: result.array()})
    }
    
    let user = req.user;
    let challenge = await Challenge.findById(req.params.id);

    let userAlreadyJoined = false;

    for (let participant of challenge.participants) {
      if (participant.userId.equals(user._id)) {
        userAlreadyJoined = true
      }

      if (userAlreadyJoined) break;
    }

    if (userAlreadyJoined) {
      return res.status(403).json({errors: [ 
        {
          message: "You have already joined this challenge."
        }
       ]})
    } else {
      let player = {
        userId: user._id
      }
      challenge.participants.push(player);
      challenge.save();

      return res.json({
        message: "Successfully joined the challenge",
        data: challenge
      })
    }
  }
)

export default router;
