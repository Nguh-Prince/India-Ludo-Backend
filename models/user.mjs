import mongoose from "mongoose";
import crypto from "crypto";

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
});

UserSchema.methods.setPassword = function (password) {
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

  let nameRegex = /^[a-zA-Z]+ [a-zA-Z]+$/;

  console.log(`Invalid name`);

  return nameRegex.test(name);
};

UserSchema.methods.validateEmail = function (email = null) {
  email = email ? email : this.email;

  let emailRegex = /^[a-zA-Z]+ [a-zA-Z]+$/;

  console.log(`Invalid email`)

  return emailRegex.test(email);
};

UserSchema.methods.validatePassword = function (password) {
  // password = password ? password : this.password

  // let passwordRegex = /^[a-zA-Z]+ [a-zA-Z]+$/

  // return passwordRegex.test(password)
  return true
}

UserSchema.methods.validate = function(password) {
  return this.validateName(this.name) && this.validateEmail(this.email) && this.validatePassword(password)
}

export default mongoose.model("User", UserSchema);
