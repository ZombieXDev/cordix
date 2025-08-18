const GuildDelete = {
  name: "GUILD_DELETE",
  alias: "guildDelete",
  transform: (client, rawData) => {
    if (client.cache?.guilds) {
      return client.guilds.cache.get(rawData.id);
    }

    return rawData;
  },

  handler: (client, data, shardId) => {
    if (client.cache?.guilds) {
      client.guilds.cache.delete(data.id);
    }

    console.log(data);
  },
};

module.exports = GuildDelete;
