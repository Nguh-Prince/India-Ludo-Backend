import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult, checkSchema } from "express-validator";

import User from "../models/user.mjs";
import { validateName, validatePassword } from "../utils/validators.mjs";
import nodemailer from "nodemailer";
import Token, { ResetToken } from "../models/token.mjs";
import Blacklist from "../models/blacklist.mjs";
import crypto from "crypto";
import Role from "../models/role.mjs";

const router = express.Router();

const bcryptSalt = process.env.BCRYPT_SALT;
const SERVER_URL = process.env.SERVER_URL;

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  host: process.env.EMAIL_HOST,
  port: 465,
  // secure: true
});

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email });

  if (!user) throw new Error("User does not exist");
  let token = await ResetToken.findOne({ userId: user._id });
  if (token) await token.deleteOne();
  let resetToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .pbkdf2Sync(resetToken, Number(bcryptSalt).toString(), 1000, 64, "sha512")
    .toString("hex");

  // user can have only one password reset token at a time
  await ResetToken.deleteMany({ userId: user._id });

  await new ResetToken({
    userId: user._id,
    token: hash,
    createdAt: Date.now(),
  }).save();

  const url = `${SERVER_URL}/auth/reset-password?token=${resetToken}&id=${user._id}`;
  console.log(`SERVER_URL is ${SERVER_URL}`);
  await transporter
    .sendMail({
      to: user.email,
      subject: "Password reset link",
      html: `Click <a href='${url}'>here</a> to reset your password`,
    })
    .then(() => {
      console.log(
        `Successfully sent password reset link to the email: ${user.email}`
      );
    })
    .catch((reason) => {
      console.log(
        `Error sending password reset link to ${user.email}. Reason:`
      );
      console.log(reason);
    });
  return resetToken;
};

const resetPassword = async (userId, token, password) => {
  let passwordResetToken = await ResetToken.findOne({ userId });
  if (!passwordResetToken) {
    throw new Error("Invalid or expired password reset token");
  }
  const hashedToken = crypto
    .pbkdf2Sync(token, Number(bcryptSalt).toString(), 1000, 64, "sha512")
    .toString("hex");

  console.log(`The hashed token is: ${hashedToken}`);

  const isValid = hashedToken === passwordResetToken.token;

  if (!isValid) {
    throw new Error("Invalid or expired password reset token");
  }
  const user = await User.findById({ _id: userId });
  user.setPassword(password, true);

  user
    .save()
    .then(async () => {
      console.log(`Modified user's password successfully, sending email`);

      await transporter
        .sendMail({
          to: user.email,
          subject: "Password reset successfully!",
          html: `Password reset operation was successful`,
        })
        .then(() => {
          console.log(`Successfully sent the email to ${newUser.email}`);
        })
        .catch((reason) => {
          console.log(`Error sending email to ${newUser.email}, reason: `);
          console.log(reason);
        });

      await passwordResetToken.deleteOne();
    })
    .catch((reason) => {
      console.log(`Error setting user's password. Reason: `);
      console.log(reason);
    });
  return true;
};

const userWithEmailExists = async (email) => {
  const user = await User.findOne({ email: email });

  if (user) {
    throw new Error("E-mail already in use");
  }
};

const userWithEmailDoesNotExist = async (email) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new Error("No user exists with this eamil address");
  }
};

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
      await userWithEmailExists(value);
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
  async (req, res) => {
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

    let userRole = await Role.findOneAndUpdate(
      { name: "user" },
      { $set: { name: "user" } },
      { upsert: true }
    );

    newUser.roleId = userRole._id;

    // Save newUser object to database
    newUser
      .save()
      .then(async () => {
        console.log(`User saved successfully`);

        const verificationToken = await newUser.generateVerificationToken();

        const url = `${SERVER_URL}/auth/verify/${newUser._id}/${verificationToken.token}`;

        await transporter
          .sendMail({
            to: req.body.email,
            subject: "Verify Account",
            html: `Input the code: ${verificationToken.code} to confirm your account, or click <a href='${url}'>here</a>. The link and code expire in 1 hour`,
          })
          .then(() => {
            console.log(`Successfully sent the email to ${newUser.email}`);
          })
          .catch((reason) => {
            console.log(`Error sending email to ${newUser.email}, reason: `);
            console.log(reason);
          });
        return res.status(200).send({
          message: `Registered successfully. Sent a verification email to ${req.body.email}`,
          data: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            created: newUser.created,
            verified: newUser.verified,
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
        throw new Error("E-mail already in use");
      }
    })
    .withMessage("Invalid email or password"),
  (req, res) => {
    const result = validationResult(req);
    console.log(`Calling the login endpoint`);

    if (!result.isEmpty()) {
      return res.status(401).json({
        message: "Authentication failed. Invalid email address or password.",
      });
    }

    let query = {
      email: req.body.email,
    };

    User.findOne(query)
      .populate("roleId")
      .then((result) => {
        console.log(`Query returned result: `);
        console.log(result);

        if (!result || !result.checkPassword(req.body.password)) {
          return res.status(401).json({
            message:
              "Authentication failed. Invalid email address or password.",
          });
        }

        console.log(`Deleting hash and salt from resut`);

        return res.json({
          token: jwt.sign(
            {
              email: result.email,
              fullName: result.name,
              _id: result._id,
              role: result.roleId,
            },
            "RESTFULAPIs"
          ),
          user: result.getUserObjectWithoutHash(),
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
    console.log(error);
  }
});

router.get("/verify-with-code/:id/:code", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });

    if (!user) return res.status(400).send("Invalid link");

    const token = await Token.findOne({
      userId: user._id,
      code: req.params.code,
    });

    if (!token) return res.status(400).send("Invalid link");

    await User.findById(user._id).updateOne({ verified: true });
    await Token.findByIdAndRemove(token._id);

    res.send("Email verified successfully");
  } catch (error) {
    res.status(400).send("An error occured");
    console.log(error);
  }
});

router.post(
  "/request-password-reset",
  body("email").trim().isEmail().withMessage("Invalid email passed"),
  body("email")
    .trim()
    .custom(async (value) => {
      await userWithEmailDoesNotExist(value);
    })
    .withMessage("No user exists with this email address"),
  async (req, res, next) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      return res.status(400).send({ errors: result.array() });
    }

    const requestPasswordResetService = await requestPasswordReset(
      req.body.email
    ).catch((reason) => {
      console.log(`Error requesting password reset, reason: `);
      console.log(reason);

      res.status(404).send({
        errors: [
          {
            type: "body",
            msg: reason,
          },
        ],
      });
    });
    return res.json(requestPasswordResetService);
  }
);

router.get("/reset-password", async (req, res) => {
  return res.send(
    `<form method="post"><input placeholder="New password" type="password" name='password' /></form>`
  );
});

router.post(
  "/reset-password",
  body("password")
    .custom((value) => {
      return validatePassword(value);
    })
    .withMessage(
      "Password must be 8-30 characters, contain at least one of the following (uppercase letter, lowercase letter, number, special character)."
    ),
  async (req, res) => {
    let result = validationResult(req);
    let errors = [];

    if (!result.isEmpty()) {
      errors = result.array();
    }

    await resetPassword(
      req.query.id,
      req.query.token,
      req.body.password
    ).catch((reason) => {
      console.log(`Error resetting the password. Reason`);
      console.log(reason);

      errors.push({
        message: "Invalid or expired password reset token",
      });
    });

    if (errors.length > 0) {
      return res.status(400).json({ errors: errors });
    }

    return res.json({
      message: "Password reset successfully"
    });
  }
);

router.post("/logout", async (req, res) => {
  try {
    if (req.user) {
      const authHeader = req.headers.authorization;
      const accessToken = authHeader.split(" ")[1];

      const checkIfBlacklisted = await Blacklist.findOne({
        token: accessToken,
      }); // Check if that token is blacklisted
      // if true, send a no content response.
      if (checkIfBlacklisted) return res.sendStatus(204);
      // otherwise blacklist token
      const newBlacklist = new Blacklist({
        token: accessToken,
      });
      await newBlacklist.save();

      res.status(200).json({ message: "You are logged out!" });
    } else {
      return res.sendStatus(204);
    }
  } catch (error) {}
});

export const loginRequired = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized user!!" });
  }
};

export default router;
