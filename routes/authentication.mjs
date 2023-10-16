import express from "express";
import jwt from "jsonwebtoken";

import User from "../models/user.mjs";

const router = express.Router();

router.get("/", (req, res) => {
  return res.json({
    message: "Routing to authentication.mjs endpoints"
  })
})

router.post("/signup", (req, res) => {
  console.log(`Sign up endpoint requested, request body: `)
  console.log(req.body)

  // Creating empty user object
  let newUser = new User();

  // Initialize newUser object with request data
  (newUser.name = req.body.name),
    (newUser.email = req.body.email),
    (newUser.password = req.body.password);

  // Call setPassword function to hash password
  newUser.setPassword(req.body.password);

  console.log(`Created new user. Details: ${newUser.toString()}`)

  if (newUser.validate(req.body.password)) {
  // Save newUser object to database
  newUser.save().then(() => {
    console.log(`User saved successfully`)
  }).catch((reason) => {
    console.log(`Error saving the user, reason: `)
    console.log(reason)
  })} else {
    console.log(`The user object is not valid`)
  }
});

router.post("/login", (req, res) => {
  let query = {
    email: req.body.email
  }
  
  User.findOne(query).then( (result) => {
    console.log(`Query returned result: `)
    console.log(result)

    if (!result || !result.checkPassword(req.body.password)) {
      return res.status(401).json({ message: 'Authentication failed. Invalid user or password.' });
    }

    return res.json({ token: jwt.sign({ email: result.email, fullName: result.fullName, _id: result._id }, 'RESTFULAPIs') });
  } ).catch((reason) => {
    console.log(`Error getting user with email: ${query.email}, reason`)
    console.log(reason)
  })
})

export const loginRequired = function(req, res, next) {
  if (req.user) {
    next()
  } else {
    return res.status(401).json({message: "Unauthorized user!!"})
  }
} 

export default router;
