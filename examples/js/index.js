const { Client, Constants } = require("../../src/index.js");

const client = new Client({
  token:
    "",
  intents: Constants.DefaultIntents,
  presence: {
    status: "online",
    activities: [{ name: "My Awesome Bot", type: 0 }],
  },
  debug: true,
});

client
  .on("onReady", async() => {
    console.log("Hello World");
  })
  .on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content === "ping") {
      message.reply("Hi").then((m) => {
        client.editMessage(message.channelID, m.id, "Hi!!");
      });
    }
  }).on("messageDelete",async m => {
console.log(await client.getMessage(m.channel_id, "ID"))
  })

client.login();
client.OnShutDown();
