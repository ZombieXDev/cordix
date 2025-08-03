const Gateway = require("./Gateway");
const EventEmitter = require("events");
const Logger = require("../utils/Logger");
const Constants = require("../utils/Constants");

class ShardManager extends EventEmitter {
  /**
   * @param {string} token
   * @param {object} options
   * @param {number} [options.totalShards=1]
   * @param {number} [options.intents=Constants.DefaultIntents]
   * @param {object} [options.presence=null]
   */
  constructor(token, options = {}) {
    super();
    this.token = token;
    this.totalShards = options.totalShards ?? 1;
    this.intents = options.intents ?? Constants.DefaultIntents;
    this.presence = options.presence ?? null;
    this.debug = options.debug ?? false;
    this.shards = new Map();
    this._spawnedShards = 0;
    this._spawnInterval = 5500;
    this._spawnQueue = [];
    this._isSpawning = false;
    this._setupShards();
  }

  _setupShards() {
    for (let i = 0; i < this.totalShards; i++) {
      this._spawnQueue.push(i);
    }
  }

  async connectAll() {
    if (this._isSpawning) {
      Logger.warn("[ShardManager] Shards are already spawning.");
      return;
    }
    this._isSpawning = true;
    this._processSpawnQueue();
  }

  async _processSpawnQueue() {
    if (this._spawnQueue.length === 0) {
      this._isSpawning = false;
      Logger.info("[ShardManager] All shards spawned.");
      return;
    }
    const shardId = this._spawnQueue.shift();
    Logger.info(
      `[ShardManager] Spawning shard ${shardId}/${this.totalShards - 1}...`
    );
    const shard = new Gateway(this.token, {
      intents: this.intents,
      presence: this.presence,
      shard: [shardId, this.totalShards],
      debug: this.debug,
    });
    shard.on("raw", (payload) => this.emit("raw", shardId, payload));
    shard.on("ready", (data) => this.emit("ready", shardId, data));
    shard.on("disconnect", (code) => this.emit("disconnect", shardId, code));
    shard.on("error", (err) => this.emit("error", shardId, err));
    shard.on("ping", (ping) => this.emit("ping", shardId, ping));
    shard.on("close", (code, reason) =>
      this.emit("close", shardId, code, reason)
    );
    shard.on("open", () => this.emit("shardReady", shardId));
    this.shards.set(shardId, shard);
    shard.connect();
    this._spawnedShards++;
    if (this._spawnQueue.length > 0) {
      await new Promise((r) => setTimeout(r, this._spawnInterval));
      this._processSpawnQueue();
    } else {
      this._isSpawning = false;
      Logger.info("[ShardManager] All shards have been initiated.");
    }
  }

  getShard(id) {
    return this.shards.get(id) ?? null;
  }

  broadcast(payload) {
    for (const shard of this.shards.values()) {
      if (shard.ws && shard.ws.readyState === (shard.ws.OPEN ?? 1)) {
        shard.sendPayload(payload).catch((err) => {
          Logger.error(
            `[ShardManager] Failed to broadcast payload to shard ${
              shard.shard ? shard.shard[0] : "?"
            }:`,
            err
          );
        });
      }
    }
  }

  disconnectAll(code = 1000, reason = "") {
    for (const shard of this.shards.values()) {
      shard.disconnect(code, reason);
    }
    this.shards.clear();
    this._spawnQueue = [];
    this._isSpawning = false;
    this._spawnedShards = 0;
    Logger.info("[ShardManager] All shards disconnected.");
  }
}

module.exports = ShardManager;
