const { Client, Constants } = require("../../src/index.js");

const client = new Client({
  token: "",
  intents:
    Constants.DefaultIntents |
    Constants.Intents.DIRECT_MESSAGES |
    Constants.Intents.GUILD_MESSAGE_TYPING,
  presence: {
    status: "online",
    activities: [{ name: "My Awesome Bot", type: 0 }],
  },
  debug: true,
  cache: {
    message: {
      msgDelete: true,
      msgUpdate: true,
    },
    guilds: true,
  },
});

client
  .on("onReady", async () => {
    console.log("is Ready");
  })
  .on("guildCreate", (guild) => {
    console.log(`Joined guild: ${guild.name} | ID: ${guild.id}`);
  })
  .on("messageCreate", async (message) => {
    if (message.content === "ping") {
      message.reply(message.guild.iconURL());
    }
  })
  .on("messageUpdate", (m) => {
    console.log("Old message:", m.old_content.content);
    console.log("Updated message:", m.new_content.content);
  });

client.login();
client.handleShutdown();
