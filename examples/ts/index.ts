import { Client, Constants } from "../../src/index.js";

const client = new Client({
  token: "",
  intents: Constants.DefaultIntents,
  presence: {
    status: "online",
    activities: [{ name: "My Awesome Bot", type: 0 }],
  },
  debug: false,
});

client
  .on("onReady", () => {
    console.log(`${client.user.username} is ready!`);
  })
  .on("messageCreate", async (message:any) => {
    if (message.author.bot) return;
    if (message.content === "!ping") {
      client.sendMessage(message.channel_id, "🏓 Pong!");
    }
  })


client.login();
client.OnShutDown();