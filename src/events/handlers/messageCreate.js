const Message = require("../../structures/Message");

const MessageCreate = {
  name: "MESSAGE_CREATE",
  alias: "messageCreate",
  transform: (client, rawData) => {
    const message = new Message(client, rawData);

    if (client.cache?.message?.msgDelete || client.cache?.message?.msgUpdate) {
      client.messagesCache.set(rawData.id, message);
    }

    return message;
  },

  handler: (client, message, shardId) => {},
};

module.exports = MessageCreate;
