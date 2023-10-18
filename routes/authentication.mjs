import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult, checkSchema } from "express-validator";

import User from "../models/user.mjs";
import { validateName, validatePassword } from "../utils/validators.mjs";
import nodemailer from "nodemailer";
import Token from "../models/token.mjs";

const router = express.Router();

const NUMBER_OF_COINS_GIVEN_ON_SIGNUP = 5

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

router.get("/", (req, res) => {
  return res.json({
    message: "Routing to authentication.mjs endpoints",
  });
});

router.post(
  "/signup",
  checkSchema(
    {
      email: { isEmail: { errorMessage: "Must be a valid e-mail address" } },
      password: {
        isLength: {
          options: { min: 8 },
          errorMessage: "Password should be at least 8 characters",
        },
      },
      name: { notEmpty: true },
    },
    ["body"]
  ),
  body("email")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });

      if (user) {
        throw new Error("E-mail already in use");
      }
    })
    .withMessage("The email address is already taken"),
  body("password")
    .custom((value) => {
      return validatePassword(value);
    })
    .withMessage(
      "Password must be 8-30 characters, contain at least one of the following (uppercase letter, lowercase letter, number, special character)."
    ),
  body("name")
    .custom((value) => {
      return validateName(value);
    })
    .withMessage("First and last name required"),
  (req, res) => {
    console.log(`Sign up endpoint requested, request body: `);
    console.log(req.body);
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).send({ errors: result.array() });
    }

    // Creating empty user object
    let newUser = new User();

    // Initialize newUser object with request data
    (newUser.name = req.body.name),
      (newUser.email = req.body.email),
      (newUser.password = req.body.password);

    // Call setPassword function to hash password
    newUser.setPassword(req.body.password);
    newUser.numberOfCoins = NUMBER_OF_COINS_GIVEN_ON_SIGNUP;

    console.log(`Created new user. Details: ${newUser.toString()}`);

    // Save newUser object to database
    newUser
      .save()
      .then(async () => {
        console.log(`User saved successfully`);

        const verificationToken = await newUser.generateVerificationToken();

        const url = `${process.env.SERVER_URL}/auth/verify/${newUser._id}/${verificationToken.token}`;

        await transporter.sendMail({
          to: req.body.email,
          subject: "Verify Account",
          html: `Click <a href='${url}'>here</a> to confirm your email. This link expires in 7 days after which your account will be automatically deleted if it is not verified`,
        }).then(() => {
          console.log(`Successfully sent the email to ${newUser.email}`)
        }).catch((reason) => {
          console.log(`Error sending email to ${newUser.email}, reason: `)
          console.log(reason)
        });
        return res
          .status(200)
          .send({
            message: `Registered successfully. Sent a verification email to ${req.body.email}`,
            data: {
              id: newUser._id,
              name: newUser.name,
              email: newUser.email,
              created: newUser.created,
            },
          });
      })
      .catch((reason) => {
        console.log(`Error saving the user, reason: `);
        console.log(reason);
      });
  }
);

router.post(
  "/login",
  body("email")
    .trim()
    .isEmail()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });

      if (!user) {
        throw new Error("Invalid email or password");
      }
    })
    .withMessage("Invalid email or password"),
  (req, res) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      res.status(400).send({ errors: result.array() });
    }

    let query = {
      email: req.body.email,
    };

    User.findOne(query)
      .then((result) => {
        console.log(`Query returned result: `);
        console.log(result);

        if (!result || !result.checkPassword(req.body.password)) {
          return res.status(401).json({
            message: "Authentication failed. Invalid user or password.",
          });
        }

        return res.json({
          token: jwt.sign(
            { email: result.email, fullName: result.fullName, _id: result._id },
            "RESTFULAPIs"
          ),
        });
      })
      .catch((reason) => {
        console.log(`Error getting user with email: ${query.email}, reason`);
        console.log(reason);
      });
  }
);

router.get("/verify/:id/:token", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) return res.status(400).send("Invalid link");

    const token = await Token.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!token) return res.status(400).send("Invalid link");

    await User.findById(user._id).updateOne({ verified: true });
    await Token.findByIdAndRemove(token._id);

    res.send("Email verified successfully");
  } catch (error) {
    res.status(400).send("An error occured");
    console.log(error)
  }
});

export const loginRequired = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized user!!" });
  }
};

export default router;
