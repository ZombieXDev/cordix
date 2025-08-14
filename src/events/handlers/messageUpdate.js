const Message = require("../../structures/Message");
const Client = require("../../client/Client");

const MessageUpdate = {
  name: "MESSAGE_UPDATE",
  alias: "messageUpdate",
  transform: (client, rawData) => {
    if (client.cache?.message?.msgUpdate) {
      const msg = client.messagesCache.get(rawData.id);
      client.messagesCache.clear();
      return { old_content: msg, new_content: new Message(client, rawData) };
    }
    return new Message(client, rawData);
  },
  handler: (client, message, shardId) => {},
};

module.exports = MessageUpdate;
