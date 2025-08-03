const WebSocket = require("ws");
const EventEmitter = require("events");
const OPCodes = require("./OPCodes");
const Logger = require("../utils/Logger");

class Gateway extends EventEmitter {
  /**
   * @param {string} token
   * @param {object} options
   * @param {number} options.intents
   * @param {object} [options.presence=null]
   * @param {[number, number]} [options.shard=null]
   */
  constructor(token, options) {
    super();
    this.token = token;
    this.intents = options.intents;
    this.presence = options.presence ?? null;
    this.shard = options.shard;
    this.ws = null;
    this.session_id = null;
    this.sequence = null;
    this.heartbeatInterval = null;
    this.heartbeatAcked = true;
    this._lastHeartbeatSent = null;
    this.ping = null;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 10;
    this._reconnectTimeout = null;
    this.user = null;
    this.debug = options.debug ?? false;
    this._sendQueue = [];
    this._isSending = false;
    this._lastSendTimestamp = 0;
    this._sendInterval = 100;
    Logger.setDebug(this.debug);
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      Logger.warn("[Gateway] Already connected.");
      return;
    }
    const url = `wss://gateway.discord.gg/?v=10&encoding=json`;
    this.ws = new WebSocket(url);
    this.ws.on("open", this._onOpen.bind(this));
    this.ws.on("message", this._onMessage.bind(this));
    this.ws.on("close", this._onClose.bind(this));
    this.ws.on("error", this._onError.bind(this));
    Logger.info(
      `[Gateway${this.shard ? ` Shard ${this.shard[0]}` : ""}] Connecting...`
    );
  }

  disconnect(code = 1000, reason = "") {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(code, reason);
      } else {
        this.ws.terminate();
      }
      this.ws = null;
    }
    this._isSending = false;
    this._sendQueue = [];
    Logger.info(
      `[Gateway${this.shard ? ` Shard ${this.shard[0]}` : ""}] Disconnected.`
    );
  }

  _onOpen() {
    Logger.info(
      `[Gateway${
        this.shard ? ` Shard ${this.shard[0]}` : ""
      }] Connected to Discord Gateway.`
    );
    this._reconnectAttempts = 0;
    this.emit("open");
  }

  _onMessage(data) {
    try {
      const payload = JSON.parse(data.toString());
      this._handlePayload(payload);
    } catch (err) {
      Logger.error(
        `[Gateway${
          this.shard ? ` Shard ${this.shard[0]}` : ""
        }] Failed to parse message:`,
        err
      );
    }
  }

  _handlePayload(payload) {
    const { op, t: eventName, d, s } = payload;
    if (s !== null && s !== undefined) this.sequence = s;
    switch (op) {
      case OPCodes.HELLO:
        this._startHeartbeat(d.heartbeat_interval);
        if (this.session_id) {
          Logger.info(
            `[Gateway${
              this.shard ? ` Shard ${this.shard[0]}` : ""
            }] Resuming session...`
          );
          this._resume();
        } else {
          Logger.info(
            `[Gateway${
              this.shard ? ` Shard ${this.shard[0]}` : ""
            }] Identifying...`
          );
          this._identify();
        }
        break;
      case OPCodes.DISPATCH:
        if (eventName === "READY") {
          this.session_id = d.session_id;
          this.user = d.user;
          Logger.info(
            `[Gateway${this.shard ? ` Shard ${this.shard[0]}` : ""}] READY as ${
              this.user.username
            }#${this.user.discriminator}`
          );
        }
        this.emit("raw", payload);
        break;
      case OPCodes.HEARTBEAT_ACK:
        if (this._lastHeartbeatSent !== null) {
          this.ping = Date.now() - this._lastHeartbeatSent;
        } else {
          this.ping = null;
        }
        this.heartbeatAcked = true;
        this.emit("ping", this.ping);
        break;
      case OPCodes.HEARTBEAT:
        Logger.debug(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Received HEARTBEAT, sending ACK.`
        );
        this._sendHeartbeat();
        break;
      case OPCodes.RECONNECT:
        Logger.warn(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Server requested reconnect.`
        );
        this._handleReconnect();
        break;
      case OPCodes.INVALID_SESSION:
        Logger.warn(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Invalid session, re-identifying...`
        );
        this.session_id = null;
        this.sequence = null;
        setTimeout(() => this._identify(), 1000);
        break;
      default:
        Logger.debug(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Unhandled opcode: ${op}`
        );
        break;
    }
  }

  _startHeartbeat(interval) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatAcked = true;
    this.heartbeatInterval = setInterval(() => {
      if (!this.heartbeatAcked) {
        Logger.warn(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Missed heartbeat ACK, reconnecting...`
        );
        this._handleReconnect();
        return;
      }
      this._sendHeartbeat();
    }, interval);
    Logger.debug(
      `[Gateway${
        this.shard ? ` Shard ${this.shard[0]}` : ""
      }] Heartbeat started with interval ${interval}ms.`
    );
    this._sendHeartbeat();
  }

  _sendHeartbeat() {
    this._lastHeartbeatSent = Date.now();
    this.heartbeatAcked = false;
    this.sendPayload({ op: OPCodes.HEARTBEAT, d: this.sequence });
  }

  _identify() {
    const payload = {
      op: OPCodes.IDENTIFY,
      d: {
        token: this.token,
        intents: this.intents,
        properties: {
          $os: process.platform,
          $browser: "Codix",
          $device: "Codix",
        },
        ...(this.presence ? { presence: this.presence } : {}),
        ...(this.shard ? { shard: this.shard } : {}),
      },
    };
    this.sendPayload(payload);
  }

  _resume() {
    if (!this.session_id) {
      Logger.warn(
        `[Gateway${
          this.shard ? ` Shard ${this.shard[0]}` : ""
        }] No session_id to resume with. Identifying instead.`
      );
      this._identify();
      return;
    }
    const payload = {
      op: OPCodes.RESUME,
      d: {
        token: this.token,
        session_id: this.session_id,
        seq: this.sequence,
      },
    };
    this.sendPayload(payload);
  }

  async sendPayload(payload) {
    return new Promise((resolve, reject) => {
      this._sendQueue.push({ payload, resolve, reject });
      if (!this._isSending) this._processSendQueue();
    });
  }

  async _processSendQueue() {
    if (this._sendQueue.length === 0) {
      this._isSending = false;
      return;
    }
    this._isSending = true;
    const now = Date.now();
    const timeSinceLastSend = now - this._lastSendTimestamp;
    if (timeSinceLastSend < this._sendInterval) {
      const delay = this._sendInterval - timeSinceLastSend;
      await new Promise((r) => setTimeout(r, delay));
    }
    const item = this._sendQueue.shift();
    if (!item) {
      this._isSending = false;
      return;
    }
    const { payload, resolve, reject } = item;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
        this._lastSendTimestamp = Date.now();
        Logger.debug(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Sent payload: ${OPCodes[payload.op] ?? payload.op}`
        );
        resolve();
      } catch (err) {
        Logger.error(
          `[Gateway${
            this.shard ? ` Shard ${this.shard[0]}` : ""
          }] Failed to send payload:`,
          err
        );
        reject(err);
      }
    } else {
      Logger.warn(
        `[Gateway${
          this.shard ? ` Shard ${this.shard[0]}` : ""
        }] Cannot send payload: WebSocket not open.`
      );
      reject(new Error("WebSocket not open"));
    }
    this._processSendQueue();
  }

  _onClose(code, reason) {
    Logger.warn(
      `[Gateway${
        this.shard ? ` Shard ${this.shard[0]}` : ""
      }] Connection closed: ${code} - ${reason}`
    );
    this.emit("close", code, reason);
    this._handleReconnect(code);
  }

  _onError(error) {
    Logger.error(
      `[Gateway${
        this.shard ? ` Shard ${this.shard[0]}` : ""
      }] WebSocket error:`,
      error.message
    );
    this.emit("error", error);
    this._handleReconnect();
  }

  _handleReconnect(closeCode = null) {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout);
      this._reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
    if (closeCode === 4004) {
      Logger.error(
        `[Gateway${
          this.shard ? ` Shard ${this.shard[0]}` : ""
        }] Authentication failed (Code 4004). Cannot reconnect.`
      );
      this.emit("disconnect", closeCode);
      return;
    }
    if (this._reconnectAttempts < this._maxReconnectAttempts) {
      const delay = Math.min(1000 * 2 ** this._reconnectAttempts, 30000);
      Logger.info(
        `[Gateway${
          this.shard ? ` Shard ${this.shard[0]}` : ""
        }] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts + 1}/${
          this._maxReconnectAttempts
        })`
      );
      this._reconnectAttempts++;
      this._reconnectTimeout = setTimeout(() => this.connect(), delay);
    } else {
      Logger.error(
        `[Gateway${
          this.shard ? ` Shard ${this.shard[0]}` : ""
        }] Max reconnect attempts reached. Giving up.`
      );
      this.emit("disconnect", closeCode);
    }
  }
}

module.exports = Gateway;
