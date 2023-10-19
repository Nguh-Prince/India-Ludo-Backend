let io;

var colorsTaken = [];
const numberOfPlayers = 2;

export const socketConnection = (server) => {
  io = server;

  io.on("connection", (socket) => {
    io.emit("userConnected", socket.id);

    console.log("Client connected");
    socket.on("chat message", (msg) => {
      io.emit("chat message", msg);
    });

    socket.on("move", (msg) => {
      console.log("Client sent move");
      console.log(msg);
      socket.broadcast.emit("move", msg);
    });

    socket.on("diceNumber", (msg) => {
      console.log(`Client sent diceNumber: ${msg}`);
      socket.broadcast.emit("diceNumber", msg);
    });

    socket.on("joinGame", (msg) => {
      console.log(
        `In index.js Gotten a joinGame message. colorsTaken before: `
      );
      console.log(colorsTaken);

      if (colorsTaken.includes(msg)) {
        console.log("The user has chosen a color that has already been taken");
      } else {
        colorsTaken.push(msg);

        if (colorsTaken.length >= numberOfPlayers) {
          let sequence = getSequenceFromListOfColors(colorsTaken, 0);
          io.emit("startGame", { sequence: sequence, first: colorsTaken[0] });
        }

        io.emit("colorsTaken", colorsTaken);
      }

      console.log(`In index.js Gotten a joinGame message. colorsTaken after: `);
      console.log(colorsTaken);
    });

    socket.on("restartGame", (msg) => {
      console.log("Gotten restartGame message");
      colorsTaken = [];

      // io.emit("colorsTaken", colorsTaken);
      socket.broadcast.emit("restartGame");
    });

    socket.on("colorsTaken", () => {
      console.log("Received colorsTaken event. Forwarding array: ");
      console.log(colorsTaken);
      io.emit("colorsTaken", colorsTaken);
    });

    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected`);
    });
  });
};

export const sendNewChallenge = (challenge) => {
  io.emit("newChallenge", challenge);
}