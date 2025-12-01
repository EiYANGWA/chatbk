// runs/io_controller.js
require("dotenv").config();

class IoController {
  constructor(io) {
    this.io = io;
    this.ledState = 0; // 0 = OFF, 1 = ON
    this.secretKey = process.env.SECRET_KEY || "mysecret123";
  }

  auth(req, res) {
    const key = req.headers["x-secret-key"];
    if (!key || key !== this.secretKey) {
      return res
        .status(403)
        .json({ error: "Forbidden: Invalid Secret Key" });
    }
    return true;
  }

  broadcast() {
    if (this.io) this.io.emit("led_state", this.ledState);
  }

  getState(req, res) {
    if (!this.auth(req, res)) return;
    res.json({ ledState: this.ledState });
  }

  turnOn(req, res) {
    if (!this.auth(req, res)) return;
    this.ledState = 1;
    console.log("[LED] ON");
    this.broadcast();
    res.json({ status: "success", ledState: this.ledState });
  }

  turnOff(req, res) {
    if (!this.auth(req, res)) return;
    this.ledState = 0;
    console.log("[LED] OFF");
    this.broadcast();
    res.json({ status: "success", ledState: this.ledState });
  }

  toggle(req, res) {
    if (!this.auth(req, res)) return;
    this.ledState = this.ledState === 1 ? 0 : 1;
    console.log("[LED] TOGGLE =", this.ledState);
    this.broadcast();
    res.json({ status: "success", ledState: this.ledState });
  }
}

module.exports = IoController;
