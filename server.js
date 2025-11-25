// backend/server.js
require('dotenv').config(); // โหลด environment variables
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// อ่านค่าจาก .env
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || "https://appeic.web.app";

// CORS สำหรับ frontend บน Firebase
const io = new Server(server, {
  cors: { 
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: FRONTEND_URL,
  methods: ["GET", "POST"]
}));

app.use(express.json());

// เก็บผู้ใช้
const users = new Map(); // socket.id -> { name, age, ip }

io.on('connection', (socket) => {
  const ip = socket.handshake.address.replace('::ffff:', '');
  console.log(`User connected: ${ip} | Socket: ${socket.id}`);

  // รับข้อมูลลงทะเบียน
  socket.on('register', ({ name, age }) => {
    if (!name || !age) return;

    users.set(socket.id, { name, age, ip });
    console.log(`Registered: ${name} (${age} ปี)`);

    // ส่งข้อมูลผู้ใช้ทั้งหมด
    io.emit('users', Array.from(users.values()));
    socket.emit('registered', { success: true });
  });

  // รับข้อความแชท
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

    // ส่งให้ทุกคน
    io.emit('chat', message);
  });

  // ตัดการเชื่อมต่อ
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`User left: ${user.name}`);
      users.delete(socket.id);
      io.emit('users', Array.from(users.values()));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chat Backend เริ่มแล้ว!`);
  console.log(`Frontend Firebase: ${FRONTEND_URL}`);
  console.log(`Backend Socket.io ใช้ PORT: ${PORT}`);
});
