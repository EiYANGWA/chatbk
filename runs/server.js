require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const ChatManager = require('./chat');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] }
});

app.use(cors({ origin: FRONTEND_URL, methods: ["GET", "POST"] }));
app.use(express.json());

const users = new Map();
const chatManager = new ChatManager(users, io);

// จัดการการเชื่อมต่อทั้งหมดผ่าน ChatManager
io.on('connection', (socket) => {
  chatManager.handleConnection(socket);
});

// HTTP status endpoint
app.get('/status', (req, res) => {
  res.json({ status: 200, message: 'Server is running' });
});

server.listen(PORT, () => {
  console.log(`Server เริ่มทำงานที่พอร์ต ${PORT}`);
});

module.exports = { server, io };