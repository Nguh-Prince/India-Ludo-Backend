import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import "./loadEnvironment.mjs";
import { createServer } from "node:http";
import { join } from "node:path";
import authentication from "./routes/authentication.mjs";
import challenge from "./routes/challenge.mjs";
import mongoose from "mongoose";
import { defaultSequence } from "./utils/index.mjs";
import { jsonParser, urlencodedParser } from "./utils/parsers.mjs";
import jsonwebtoken from "jsonwebtoken";
import Blacklist from "./models/blacklist.mjs";
import Role from "./models/role.mjs";
import { socketConnection } from "./utils/socket-io.mjs";
import { checkSchema } from "express-validator";
import fs from "fs";

const connectionString = process.env.ATLAS_URI || "";
const GLOBAL_FILE_PATH = join( process.cwd(), "global.json" );

console.log(`About to connect to MongoDB via mongoose`);
mongoose.connect(connectionString).catch((error) => {
  console.log(`Error connecting to MongoDB via mongoose`);
  console.log(error);
});
mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB through mongoose");
});

const app = express();

const server = http.createServer(app);

socketConnection(new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"],
  },
}));

app.use(cors("*"));

app.use(jsonParser);
app.use(urlencodedParser);

app.use(async function (req, res, next) {
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Token"
  ) {
    const accessToken = req.headers.authorization.split(" ")[1];

    const checkIfBlacklisted = await Blacklist.findOne({
      token: accessToken,
    });

    if (!checkIfBlacklisted) {
      jsonwebtoken.verify(accessToken, "RESTFULAPIs", function (err, decode) {
        if (err) req.user = undefined;
        req.user = decode;

        next();
      });
    } else { // token is blacklisted, the user logged out
      console.log(`The token used is blacklisted`)
      req.user = null;
      next();
    }
  } else {
    req.user = undefined;
    next();
  }
});

app.use("/auth", authentication);
app.use("/challenges", challenge);

app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(join(process.cwd(), 'index.html'));
  // return res.json({ message: "The server is live!" });
});

app.get("/global", (req, res) => {
  let global = fs.readFileSync( join(process.cwd(), "global.json"), 
    { encoding: "utf-8", flag: "r" }
  )
  res.json(JSON.parse(global))
})

app.post("/global", 
  checkSchema({
    MINIMUM_BET_AMOUNT: { isNumeric: { min: 1 } },
    WINNING_AMOUNT_FRACTION: { isFloat: { min: 0, max: 1 } },
    NUMBER_OF_COINS_GIVEN_ON_SIGNUP: { isNumeric: { min: 1 } },
    MAXIMUM_BET_AMOUNT: { isNumeric: { min: 0 } }
  })
, (req, res) => {
  fs.writeFileSync( GLOBAL_FILE_PATH, req.body, "utf-8" )

  res.json({
    message: "Variables set successfully",
    data: req.body
  })
})

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
