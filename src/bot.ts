import { REST, GatewayIntentBits, Events, Routes } from "discord.js";
import MittensClient from "./utils/Client.js"; // TODO "allowImportingtsExtensions"
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";

dotenv.config();

// Sentry.init({
//   dsn: "https://c9c992d5a347411db99537a0ed2c0094@o4505106964742144.ingest.sentry.io/4505106967691264",

//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0,
// });

const client = new MittensClient({ intents: [GatewayIntentBits.Guilds] });

// on boot
client.once("ready", () => {
  console.log("もしもし");
});

// handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return; // not a slash command

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN as string);
