// runs/server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const IoController = require("./io_controller");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5255;
const FRONTEND_URL = process.env.FRONTEND_URL || "*";

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());
app.use(cors({ origin: FRONTEND_URL }));

// Instantiate IO Controller (LED Simulation)
const ioCtrl = new IoController(io);

// REST APIs
app.get("/led/state", (req, res) => ioCtrl.getState(req, res));
app.post("/led/on", (req, res) => ioCtrl.turnOn(req, res));
app.post("/led/off", (req, res) => ioCtrl.turnOff(req, res));
app.post("/led/toggle", (req, res) => ioCtrl.toggle(req, res));

// Server Status Test
app.get("/status", (req, res) => {
  res.json({ status: "OK", message: "Server online" });
});

// Socket.IO connection (optional)
io.on("connection", socket => {
  console.log("Client connected:", socket.id);
  socket.emit("led_state", ioCtrl.ledState);

  socket.on("disconnect", () =>
    console.log("Client disconnected:", socket.id)
  );
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Allowed Origin: ${FRONTEND_URL}`);
});

module.exports = { server, io };
