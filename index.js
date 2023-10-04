const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const http = require("http");
const cors = require('cors');

const app = express();
app.use(cors("*"));

const server = http.createServer(app)

const io = new Server(server, {
  maxHttpBufferSize: 1e8,
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"]
  }
});

app.use(cors("*"))

app.use(express.json());

app.get('/', (req, res) => {
  // res.sendFile(join(__dirname, 'index.html'));
  return res.json({message: "The server is live!"})
});

var colorsTaken = [];
const numberOfPlayers = 2;

const defaultSequence = {
  green: {
    next: "red",
  },
  red: {
    next: "blue",
  },
  blue: {
    next: "yellow",
  },
  yellow: {
    next: "green",
  },
};

const getSequenceFromListOfColors = (listOfColors, indexOfFirstColor) => {
  let firstColor = listOfColors[indexOfFirstColor];
  let sequence = {}

  let color = firstColor;

  while (true) {
    let next = defaultSequence[color].next;

    while (!listOfColors.includes(next)) {
      next = defaultSequence[next].next;
    }

    sequence[color] = {
      next: next
    }

    color = next

    if (color === firstColor) {
      break
    }
  }

  return sequence
}

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

server.listen(4000, () => {
  console.log("server running at http://172.20.10.5:4000");
});