require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const IoController = require("./io_controller");
const ChatManager = require("./chat");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5255;

// แยกหลาย origin จาก .env
const FRONTEND_URLS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map(url => url.trim())
  : ["*"];

// ตั้งค่า CORS
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true); // allow non-browser clients
    if(FRONTEND_URLS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
}));

app.use(express.json());

// Socket.IO พร้อม CORS
const io = new Server(server, {
  cors: { origin: FRONTEND_URLS, methods: ["GET", "POST"] }
});

// Chat Manager (ระบบเดิม)
const users = new Map();
const chatManager = new ChatManager(users, io);
io.on("connection", socket => chatManager.handleConnection(socket));

// LED Controller
const ioCtrl = new IoController(io);
ioCtrl.registerRoutes(app);

// Socket.IO LED event
io.on("connection", socket => {
  ioCtrl.handleSocket(socket);
});

// Status test
app.get("/status", (req, res) => res.json({ status: "OK", message: "Server online" }));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { server, io };
