// runs/chat.js
class ChatManager {
  constructor(users, io) {
    this.users = users;
    this.io = io;
  }

  handleConnection(socket) {
    const ip = socket.handshake.address.replace('::ffff:', '');
    console.log(`User connected: ${ip} | Socket: ${socket.id}`);

    // ส่ง event การเชื่อมต่อไปยัง local backend
    this.io.emit('local-event', { 
      type: 'connect', 
      ip, 
      socketId: socket.id, 
      timestamp: new Date().toISOString() 
    });

    // จัดการการลงทะเบียน
    socket.on('register', ({ name, age }) => {
      this.handleRegister(socket, name, age);
    });

    // จัดการการส่งข้อความแชท
    socket.on('chat', (msg) => {
      this.handleChat(socket, msg);
    });

    // จัดการการตัดการเชื่อมต่อ
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // จัดการ heartbeat จาก local backend
    socket.on('heartbeat', (data) => {
      this.handleHeartbeat(socket, data);
    });
  }

  handleRegister(socket, name, age) {
    if (!name || !age) return;

    const ip = socket.handshake.address.replace('::ffff:', '');
    this.users.set(socket.id, { name, age, ip });
    
    this.io.emit('users', Array.from(this.users.values()));
    socket.emit('registered', { success: true });

    this.io.emit('local-event', { 
      type: 'register', 
      name, 
      age, 
      ip, 
      timestamp: new Date().toISOString() 
    });
  }

  handleChat(socket, msg) {
    const user = this.users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now(),
      name: user.name,
      age: user.age,
      text: msg,
      time: new Date().toLocaleTimeString('th-TH'),
      ip: user.ip
    };

    this.io.emit('chat', message);
  }

  handleDisconnect(socket) {
    const user = this.users.get(socket.id);
    if (user) {
      console.log(`User left: ${user.name}`);
      this.users.delete(socket.id);
      this.io.emit('users', Array.from(this.users.values()));

      this.io.emit('local-event', { 
        type: 'disconnect', 
        name: user.name, 
        ip: user.ip, 
        timestamp: new Date().toISOString() 
      });
    }
  }

  handleHeartbeat(socket, data) {
    const { ip, port } = data;
    // ตรวจสอบสิทธิ์การเข้าถึง heartbeat
    // สามารถเพิ่มการตรวจสอบ LOCAL_IP และ LOCAL_PORT ได้ในที่นี้
    socket.emit('status-response', { status: 200, message: 'OK' });
  }
}

module.exports = ChatManager;