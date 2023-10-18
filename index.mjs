import express from "express";
import { Server } from "socket.io";
import http from 'http';
import cors from 'cors';
import "./loadEnvironment.mjs";
import { createServer } from "node:http";
import { join } from "node:path";
import authentication from "./routes/authentication.mjs";
import challenge from "./routes/challenge.mjs";
import mongoose from "mongoose";
import { defaultSequence } from "./utils/index.mjs";
import { jsonParser, urlencodedParser } from "./utils/parsers.mjs";
import jsonwebtoken from "jsonwebtoken";

const connectionString = process.env.ATLAS_URI || "";

console.log(`About to connect to MongoDB via mongoose`)
mongoose.connect(connectionString).catch((error) => {
  console.log(`Error connecting to MongoDB via mongoose`)
  console.log(error)
});
mongoose.connection.on('connected', () => {
  console.log("Connected to MongoDB through mongoose")
})

const app = express();

const server = http.createServer(app)

const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"]
  }
});

app.use(cors("*"))

app.use(jsonParser)
app.use(urlencodedParser)

app.use(function(req, res, next) {
  if (req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') {
    jsonwebtoken.verify(req.headers.authorization.split(' ')[1], 'RESTFULAPIs', function(err, decode) {
      if (err) req.user = undefined;
      req.user = decode;

      console.log(`In jwt verification, decode is: `)
      console.log(decode)
      next();
    });
  } else {
    req.user = undefined;
    next();
  }
});

app.use("/auth", authentication);
app.use("/challenges", challenge);

app.use(express.json());

app.get('/', (req, res) => {
  // res.sendFile(join(__dirname, 'index.html'));
  return res.json({message: "The server is live!"})
});

var colorsTaken = [];
const numberOfPlayers = 2;

io.on("connection", (socket) => {
  io.emit("userConnected", socket.id)

  console.log("Client connected")
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("move", (msg) => {
    console.log("Client sent move");
    console.log(msg);
    socket.broadcast.emit("move", msg);
  });

  socket.on("diceNumber", (msg) => {
    console.log(`Client sent diceNumber: ${msg}`)
    socket.broadcast.emit("diceNumber", msg);
  });

  socket.on("joinGame", (msg) => {
    console.log(`In index.js Gotten a joinGame message. colorsTaken before: `)
    console.log(colorsTaken)

    if (colorsTaken.includes(msg)) {
      console.log("The user has chosen a color that has already been taken");
    } else {
      colorsTaken.push(msg);

      if (colorsTaken.length >= numberOfPlayers) {
        let sequence = getSequenceFromListOfColors(colorsTaken, 0)
        io.emit("startGame", {sequence: sequence, first: colorsTaken[0]});
      }

      io.emit("colorsTaken", colorsTaken);
    }

    console.log(`In index.js Gotten a joinGame message. colorsTaken after: `)
    console.log(colorsTaken)
  });

  socket.on("restartGame", (msg) => {
    console.log("Gotten restartGame message");
    colorsTaken = [];

    // io.emit("colorsTaken", colorsTaken);
    socket.broadcast.emit("restartGame")
  });

  socket.on("colorsTaken", () => {
    console.log("Received colorsTaken event. Forwarding array: ");
    console.log(colorsTaken);
    io.emit("colorsTaken", colorsTaken);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected`)
  });
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`)
})