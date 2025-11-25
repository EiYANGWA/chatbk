// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const SECRET_KEY = process.env.SECRET_KEY;
const LOCAL_IP = process.env.LOCAL_IP;
const LOCAL_PORT = process.env.LOCAL_PORT;

// CORS สำหรับ frontend Firebase
const io = new Server(server, {
  cors: { origin: FRONTEND_URL, methods: ["GET","POST"] }
});

app.use(cors({ origin: FRONTEND_URL, methods: ["GET","POST"] }));
app.use(express.json());

const users = new Map(); // socket.id -> { name, age, ip }

io.on('connection', (socket) => {
  const ip = socket.handshake.address.replace('::ffff:', '');
  console.log(`User connected: ${ip} | Socket: ${socket.id}`);

  // แจ้ง event ไป local backend
  io.emit('local-event', { type: 'connect', ip, socketId: socket.id, timestamp: new Date().toISOString() });

  // --- Chat ---
  socket.on('register', ({ name, age }) => {
    if (!name || !age) return;
    users.set(socket.id, { name, age, ip });
    io.emit('users', Array.from(users.values()));
    socket.emit('registered', { success: true });

    // ส่ง event ไป local backend
    io.emit('local-event', { type: 'register', name, age, ip, timestamp: new Date().toISOString() });
  });

  socket.on('chat', (msg) => {
    const user = users.get(socket.id);
    if (!user) return;
    const message = {
      id: Date.now(),
      name: user.name,
      age: user.age,
      text: msg,
      time: new Date().toLocaleTimeString('th-TH'),
      ip: user.ip
    };
    io.emit('chat', message);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`User left: ${user.name}`);
      users.delete(socket.id);
      io.emit('users', Array.from(users.values()));

      // ส่ง event ไป local backend
      io.emit('local-event', { type: 'disconnect', name: user.name, ip: user.ip, timestamp: new Date().toISOString() });
    }
  });

  // Heartbeat จาก local backend
  socket.on('heartbeat', (data) => {
    const { ip, port } = data;
    if (ip === LOCAL_IP && port === LOCAL_PORT) {
      console.log(`💓 Heartbeat from local backend ${ip}:${port}`);
      socket.emit('status-response', { status: 200, message: 'OK' });
    } else {
      console.log(`⚠️ Heartbeat from unknown client ${ip}:${port}`);
      socket.emit('status-response', { status: 403, message: 'Forbidden' });
    }
  });
});

// HTTP fallback status
app.get('/status', (req, res) => {
  const clientIp = req.ip.replace('::ffff:', '');
  const key = req.query.key;
  const clientPort = req.query.port;

  if (key !== SECRET_KEY || clientIp !== LOCAL_IP || clientPort !== LOCAL_PORT) {
    return res.status(403).json({ message: 'Forbidden: invalid key, IP, or port' });
  }

  console.log(`✅ Status check from allowed client ${clientIp}:${clientPort}`);
  res.json({ status: 200, message: 'OK' });
});

server.listen(PORT, () => {
  console.log(`Chat Backend เริ่มแล้ว!`);
  console.log(`Frontend Firebase: ${FRONTEND_URL}`);
  console.log(`Backend Socket.io ใช้ PORT: ${PORT}`);
  console.log(`Status endpoint ใช้ secret key, IP และ port ของ local backend`);
});
