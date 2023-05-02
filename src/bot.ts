import {
  REST,
  GatewayIntentBits,
  Events,
  Routes,
  BaseInteraction,
  Message,
} from "discord.js";
import MittensClient from "./utils/Client.js";
import { handleTranslate } from "./translate/Translate.js";
import Sentry from "@sentry/node";
import { readEnv } from "./utils/env.js";

// Sentry.init({
//   dsn: "https://c9c992d5a347411db99537a0ed2c0094@o4505106964742144.ingest.sentry.io/4505106967691264",

//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0,
// });

const client = new MittensClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

// on boot
client.once("ready", () => {
  console.log("もしもし");
});

// handle slash commands
client.on(Events.InteractionCreate, async (interaction: BaseInteraction) => {
  if (!interaction.isChatInputCommand()) return; // not a slash command

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
});

// handle translating
client.on("messageCreate", async (message: Message) => {
  if (message.author.id === client.user!.id) return;
  await handleTranslate(message);
});

client.login(readEnv("DISCORD_TOKEN"));
