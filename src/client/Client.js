const EventEmitter = require("events");
const ShardManager = require("../gateway/ShardManager");
const RestManager = require("../rest/RestManager");
const EventManager = require("../events/EventManager");
const Logger = require("../utils/Logger");
const Constants = require("../utils/Constants");

class Client extends EventEmitter {
  /**
   * @param {object} options
   * @param {string} options.token
   * @param {number} [options.intents=Constants.DefaultIntents]
   * @param {object} [options.presence=null]
   * @param {number} [options.totalShards=1]
   * @param {boolean} [options.debug=false]
   */
  constructor(options) {
    super();
    if (!options.token) {
      throw new Error("Token is required to initialize the client.");
    }
    this.token = options.token;
    this.intents = options.intents ?? Constants.DefaultIntents;
    this.presence = options.presence ?? null;
    this.debug = options.debug ?? false;
    this.totalShards = options.totalShards ?? 1;
    this.shardManager = new ShardManager(this.token, {
      totalShards: this.totalShards,
      intents: this.intents,
      presence: this.presence,
      debug: this.debug,
    });
    this.rest = new RestManager(this.token);
    this.eventManager = new EventManager(this);
    this.user = null;
    this._setupListeners();
  }

  _setupListeners() {
    this.shardManager.on("raw", (shardId, payload) => {
      this.eventManager.handleGatewayPayload(shardId, payload);
    });
    this.shardManager.on("ready", (shardId, data) => {
      if (shardId === 0) {
        this.user = data.user;
        Logger.info(
          `[Client] Client is ready as ${this.user.username}#${this.user.discriminator}`
        );
        super.emit("ready", this);
      }
      super.emit("shardReady", shardId, data);
    });
    this.shardManager.on("disconnect", (shardId, code) => {
      Logger.warn(`[Client] Shard ${shardId} disconnected with code ${code}.`);
      super.emit("shardDisconnect", shardId, code);
    });
    this.shardManager.on("error", (shardId, err) => {
      Logger.error(`[Client] Shard ${shardId} encountered an error:`, err);
      super.emit("shardError", shardId, err);
    });
    this.shardManager.on("ping", (shardId, ping) => {
      super.emit("shardPing", shardId, ping);
    });
    this.eventManager.on("messageCreate", (message) => {
      super.emit("messageCreate", message);
    });
    // you can add more event listeners as needed
  }

  /**
   * Logs in the client and connects to the gateway.
   * @returns {Promise<void>}
   */
  async login() {
    Logger.info("[Client] Logging in...");
    await this.shardManager.connectAll();
  }

  /**
   * Destroys the client, disconnecting all shards and cleaning up resources.
   * @param {number} [code=1000]
   * @param {string} [reason="Client destroyed"]
   */
  async destroy(code = 1000, reason = "Client destroyed") {
    Logger.info("[Client] Destroying client...");
    this.shardManager.disconnectAll(code, reason);
    this.emit("destroy");
  }

  /**
   * Send a message to a channel. Accepts a string (content) or a full Discord API message object.
   * @param {string} channelId Channel ID
   * @param {string|object} contentOrOptions Message content as string, or full message object (per Discord API)
   */
  async sendMessage(channelId, contentOrOptions) {
    let body;
    if (typeof contentOrOptions === "string") {
      body = { content: contentOrOptions };
    } else {
      body = contentOrOptions;
    }
    return this.rest.post(`/channels/${channelId}/messages`, body);
  }
  async editMessage(channelId, messageId, newContentOrOptions) {
    let body;
    if (typeof newContentOrOptions === "string") {
      body = { content: newContentOrOptions };
    } else {
      body = newContentOrOptions;
    }
    return this.rest.patch(
      `/channels/${channelId}/messages/${messageId}`,
      body
    );
  }

async getMessage(channelId, messageId) {
  return await this.rest.get(`/channels/${channelId}/messages/${messageId}`);
}


  async deleteMessage(channelId, messageId) {
    return this.rest.delete(`/channels/${channelId}/messages/${messageId}`);
  }

  async getUser(userId) {
    return await this.rest.get(`/users/${userId}`);
  }

  async getGuild(guildId) {
    return await this.rest.get(`/guilds/${guildId}`);
  }

  get ws() {
    return {
      status: this.shardManager.shards.size > 0 ? "connected" : "disconnected",
      shards: Array.from(this.shardManager.shards.keys()),
      uptime: uptime(),
      user: this.user,
      totalShards: this.totalShards,
      intents: this.intents,
      presence: this.presence,
      ping:
        this.shardManager.shards.size > 0
          ? this.shardManager.getShard(0)?.ping ?? null
          : null,
      shardsReady: this.shardManager.shards.size,
    };
  }

  OnShutDown() {
    process.on("SIGINT", async () => {
      console.log("Shutting down client...");
      await this.destroy();
      process.exit(0);
    });
  }
}

module.exports = Client;
