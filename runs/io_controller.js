// runs/io_controller.js
require("dotenv").config();

class IoController {
  constructor(io) {
    this.io = io;                // Socket.IO instance
    this.ledState = false;       // LED state: false=off, true=on
    this.secretKey = process.env.SECRET_KEY || "mysecret123";
  }

  // ลงทะเบียน route สำหรับ REST API
  registerRoutes(app) {
    // ตรวจสอบ secret key middleware
    const authMiddleware = (req, res, next) => {
      const key = req.headers["x-secret-key"];
      if (!key || key !== this.secretKey) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      next();
    };

    app.get("/led/state", authMiddleware, (req, res) => {
      res.json({ ledState: this.ledState });
    });

    app.post("/led/on", authMiddleware, (req, res) => {
      this.ledState = true;
      this.emitState();
      res.json({ ledState: this.ledState });
    });

    app.post("/led/off", authMiddleware, (req, res) => {
      this.ledState = false;
      this.emitState();
      res.json({ ledState: this.ledState });
    });

    app.post("/led/toggle", authMiddleware, (req, res) => {
      this.ledState = !this.ledState;
      this.emitState();
      res.json({ ledState: this.ledState });
    });
  }

  // ส่ง event ผ่าน Socket.IO แบบ real-time
  handleSocket(socket) {
    // ส่งสถานะปัจจุบันให้ client ที่เพิ่งเชื่อมต่อ
    socket.emit("ledState", this.ledState);

    // รับ toggle ผ่าน Socket.IO (optional)
    socket.on("ledToggle", () => {
      this.ledState = !this.ledState;
      this.emitState();
    });
  }

  // ฟังก์ชันช่วยส่ง event LED state ไปทุก client
  emitState() {
    if (this.io) {
      this.io.emit("ledState", this.ledState);
    }
    console.log("LED state updated:", this.ledState ? "ON" : "OFF");
  }

  // สำหรับเรียกจาก route /led/state
  getState(req, res) {
    res.json({ ledState: this.ledState });
  }

  turnOn(req, res) {
    this.ledState = true;
    this.emitState();
    res.json({ ledState: this.ledState });
  }

  turnOff(req, res) {
    this.ledState = false;
    this.emitState();
    res.json({ ledState: this.ledState });
  }
}

module.exports = IoController;
