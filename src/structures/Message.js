const Client = require("../client/Client");

class Message {
  /**
   * @param {Client} client
   * @param {object} data
   * @param {string} data.id
   * @param {string} data.channel_id
   * @param {string|null} [data.guild_id]
   * @param {any} data.author
   * @param {string} data.content
   * @param {string|Date} data.timestamp
   */
  constructor(client, data) {
    this.client = client;
    this.id = data.id;
    this.channel_id = data.channel_id;
    this.guild_id = data.guild_id ?? null;
    this.author = data.author;
    this.content = data.content;
    this.timestamp = new Date(data.timestamp);
  }

  async reply(content) {
    return this.client.sendMessage(this.channel_id, { content });
  }
}

module.exports = Message;
