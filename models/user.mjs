import mongoose from "mongoose";
import crypto from "crypto";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../utils/validators.mjs";
import Token from "./token.mjs";
const Schema = mongoose.Schema;

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  hash: String,
  salt: String,
  created: {
    type: Date,
    default: Date.now,
  },
  verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: "role",
    required: true,
  },
});

UserSchema.methods.setPassword = function (password, validateStrength=false) {
  if (validateStrength) {
    if (!this.validatePassword(password)) {
      throw new Error("Password must be 8-30 characters, contain at least one of the following (uppercase letter, lowercase letter, number, special character).")
    }
  }
  // Creating a unique salt for a particular user
  this.salt = crypto.randomBytes(16).toString("hex");

  // Hashing user's salt and password with 1000 iterations,

  this.hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
    .toString(`hex`);
};

UserSchema.methods.toString = function () {
  return `name: ${this.name} email: ${this.email}`;
};

// Method to check the entered password is correct or not
UserSchema.methods.checkPassword = function (password) {
  var hash = crypto
    .pbkdf2Sync(password, this.salt, 1000, 64, `sha512`)
    .toString(`hex`);
  return this.hash === hash;
};

UserSchema.methods.validateName = function (name = null) {
  name = name ? name : this.name;

  return validateName(name);
};

UserSchema.methods.validateEmail = function (email = null) {
  email = email ? email : this.email;

  return validateEmail(email);
};

UserSchema.methods.validatePassword = function (password) {
  password = password ? password : this.password;

  return validatePassword(password);
};

UserSchema.methods._validate = function (password) {
  return (
    this.validateName(this.name) &&
    this.validateEmail(this.email) &&
    this.validatePassword(password)
  );
};

function generateOTP(length = 4) {
  var digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

UserSchema.methods.generateVerificationToken = async function () {
  const user = this;

  await Token.deleteMany({ userId: user });

  const verificationToken = await new Token({
    userId: user._id,
    token: crypto.randomBytes(32).toString("hex"),
    code: generateOTP(),
  }).save();

  return verificationToken;
};

UserSchema.methods.getUserObjectWithoutHash = function () {
  const user = this;

  return {
    _id: user._id,
    verified: user.verified,
    created: user.created,
    name: user.name,
    email: user.email,
    roleId: user.roleId,
  };
};

export default mongoose.model("User", UserSchema);
