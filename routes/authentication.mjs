import express from "express";
import jwt from "jsonwebtoken";
import { body, validationResult, checkSchema } from "express-validator";

import User from "../models/user.mjs";
import { validateName, validatePassword } from "../utils/validators.mjs";

const router = express.Router();

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
  body("password").custom((value) => {
    return validatePassword(value);
  }).withMessage("Password must be 8-30 characters, contain at least one of the following (uppercase letter, lowercase letter, number, special character)."),
  body("name").custom((value) => {
    return validateName(name)
  }).withMessage("First and last name required"),
  (req, res) => {
    console.log(`Sign up endpoint requested, request body: `);
    console.log(req.body);
    const result = validationResult(req);

    if (!result.isEmpty()) {
      res.status(400).send({ errors: result.array() });
    }

    // Creating empty user object
    let newUser = new User();

    // Initialize newUser object with request data
    (newUser.name = req.body.name),
      (newUser.email = req.body.email),
      (newUser.password = req.body.password);

    // Call setPassword function to hash password
    newUser.setPassword(req.body.password);

    console.log(`Created new user. Details: ${newUser.toString()}`);

    if (newUser.validate(req.body.password)) {
      // Save newUser object to database
      newUser
        .save()
        .then(() => {
          console.log(`User saved successfully`);
        })
        .catch((reason) => {
          console.log(`Error saving the user, reason: `);
          console.log(reason);
        });
    } else {
      console.log(`The user object is not valid`);
    }
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

export const loginRequired = function (req, res, next) {
  if (req.user) {
    next();
  } else {
    return res.status(401).json({ message: "Unauthorized user!!" });
  }
};

export default router;
