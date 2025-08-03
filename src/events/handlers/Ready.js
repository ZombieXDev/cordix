const Client = require("../../client/Client");

const Ready = {
  name: "READY",
  alias: "onReady",
  transform: (client, rawData) => rawData,
  handler: (client, message, shardId) => {
    client.user = message.user;
  },
};

module.exports = Ready;
