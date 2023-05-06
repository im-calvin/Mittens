import { GatewayIntentBits, Events, BaseInteraction, Message } from "discord.js";
import MittensClient from "./utils/Client.js";
import { handleTranslate } from "./translate/Translate.js";
import Sentry from "@sentry/node";
import { readEnv } from "./utils/env.js";
import { init } from "./init.js";
import { scrape } from "./utils/schedule.js";

init();

const boot = Sentry.startTransaction({
  op: "boot",
  name: "First time launch of Mittens",
});

export const client = new MittensClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
}); 

// on boot
client.once("ready", () => {
  scrape();
  console.log("もしもし");
});

// handle slash commands
client.on(Events.InteractionCreate, async (interaction: BaseInteraction) => {
  if (!interaction.isChatInputCommand()) return; // not a slash command
  const transaction = Sentry.startTransaction({
    op: "slash",
    name: "Slash command interaction",
  });

  // handle commands
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);
  }
  transaction.finish();
});

// handle translating
client.on("messageCreate", async (message: Message) => {
  const transaction = Sentry.startTransaction({
    op: "msgCreate",
    name: "Message creation interaction",
  });
  if (message.author.id === client.user!.id) return;
  await handleTranslate(message);
  transaction.finish();
});

client.login(readEnv("DISCORD_TOKEN"));
boot.finish();
