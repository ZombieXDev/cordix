const { Client, Constants } = require("../../src/index.js");

const client = new Client({
  token: "",
  intents: Constants.DefaultIntents,
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
  },
});

client
  .on("onReady", async () => {
    console.log(client.cache);
  })
  .on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content === "ping") {
      message.reply("Hi").then((m) => {
        client.editMessage(message.channelID, m.id, "Hi!!");
      });
    }
  })
  .on("messageUpdate", (m) => {
    console.log("Old message:", m.old_content.content);
    console.log("Updated message:", m.new_content.content);
  });

client.login();
client.OnShutDown();
