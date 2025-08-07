const Message = require("../../structures/Message");
const Client = require("../../client/Client");

const MessageUpdate = {
  name: "MESSAGE_UPDATE",
  alias: "messageUpdate",
  transform: (client, rawData) => {
    return new Message(client, rawData);
  },
  handler: (client, message, shardId) => {
    // here you can handle the message event

  },
};

module.exports = MessageUpdate;
