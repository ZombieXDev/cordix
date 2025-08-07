const Message = require("../../structures/Message");
const Client = require("../../client/Client");

const MessageDelete = {
  name: "MESSAGE_DELETE",
  alias: "messageDelete",
  transform: (client, rawData) => {
    return rawData //new Message(client, rawData);
  },
  handler: (client, message, shardId) => {
    // here you can handle the message event
  },
};

module.exports = MessageDelete;
