const typingStart = {
  name: "TYPING_START",
  alias: "typingStart",
  transform: (client, rawData) => {
    return rawData;
  },

  handler: (client, data, shardId) => {},
};

module.exports = typingStart;
