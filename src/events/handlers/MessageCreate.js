const Message = require("../../structures/Message");
const Client = require("../../client/Client");

const MessageCreate = {
  name: "MESSAGE_CREATE",
  alias: "messageCreate",
  transform: (client, rawData) => {
    return new Message(client, rawData);
  },
  handler: (client, message, shardId) => {
    // here you can handle the message event
    console.log(`Message from ${message.author.username}: ${message.content}`);
  },
};

module.exports = MessageCreate;
