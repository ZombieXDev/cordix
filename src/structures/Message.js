const Client = require("../client/Client");

class Message {
  /**
   * @param {Client} client
   * @param {object} data
   */
  constructor(client, data) {
    this.client = client;
    this.id = data.id;
    this.type = data.type;
    this.content = data.content;
    this.tts = data.tts;
    this.attachments = data.attachments;
    this.mentions = data.mentions;
    this.mention_everyone = data.mention_everyone;
    this.mention_roles = data.mention_roles;
    this.channelID = data.channel_id ?? null;
    this.guildID = data.guild_id ?? null;
    this.author = data.author;
    this.member = data.member ?? null;
    this.timestamp = new Date(data.timestamp);
    this.editedTimestamp = data.edited_timestamp ? new Date(data.edited_timestamp) : null;
    this.pinned = data.pinned ?? false;
    this.flags = data.flags ?? 0;
    this.embeds = data.embeds ?? [];
    this.components = data.components ?? [];
  }

  /**
   * @param {string|object} content
   * @returns {Promise<Message>}
   */
  async reply(content) {
    const payload = typeof content === "string" ? { content } : content;
    return await this.client.sendMessage(this.channelID, payload);
  }

  /**
   * @param {string|object} newContent
   * @returns {Promise<Message>}
   */
  async edit(newContent) {
    const payload = typeof newContent === "string" ? { content: newContent } : newContent;
    return await this.client.editMessage(this.channelID, this.id, payload);
  }

  /**
   * @returns {Promise<void>}
   */
  async delete() {
    return await this.client.deleteMessage(this.channelID, this.id);
  }
/**
   * @returns {Promise<Message>}
   */
  async fetch() {
    const data = await this.client.getMessage(this.channelID, this.id);
    return new Message(this.client, data);
  }

  

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      content: this.content,
      tts: this.tts,
      channelID: this.channelID,
      guildID: this.guildID,
      author: this.author,
      timestamp: this.timestamp,
      editedTimestamp: this.editedTimestamp,
      pinned: this.pinned,
      flags: this.flags,
      attachments: this.attachments,
      mentions: this.mentions,
      mention_roles: this.mention_roles,
      mention_everyone: this.mention_everyone,
      embeds: this.embeds,
      components: this.components,
    };
  }
}

module.exports = Message;
