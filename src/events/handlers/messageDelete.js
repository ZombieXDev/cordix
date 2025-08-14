const Message = require("../../structures/Message");
const Client = require("../../client/Client");

const MessageDelete = {
  name: "MESSAGE_DELETE",
  alias: "messageDelete",
  transform: (client, rawData) => {
    if (client.cache?.message?.msgDelete) {
      const msg = client.messagesCache.get(rawData.id);
      client.messagesCache.clear();
      return msg ?? rawData;
    }
    return rawData;
  },
  handler: (client, message, shardId) => {
   
  },
};

module.exports = MessageDelete;
