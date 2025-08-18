const Guild = require("../../structures/Guild");

const GuildCreate = {
  name: "GUILD_CREATE",
  alias: "guildCreate",
  transform: (client, rawData) => {
    if (client.guilds.cache.has(rawData.id)) return null;
    return new Guild(client, rawData);
  },

  handler: (client, data, shardId) => {
    if (client.cache?.guilds) {
      client.guilds.cache.set(data.id, new Guild(client, data));
    }
  },
};

module.exports = GuildCreate;
