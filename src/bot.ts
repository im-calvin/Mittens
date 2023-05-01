import { REST, GatewayIntentBits, Events } from "discord.js";
import MittensClient from "./utils/Client"; // TODO "allowImportingtsExtensions"
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
client.loadCommands();

// on boot
client.once("ready", () => {
  console.log("もしもし");
});

// on interaction
client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isChatInputCommand()) {
    // handle translation
    return;
  }
  // handle slash commands
  console.log(interaction);
});

// register the commands
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN as string);
client.login(process.env.DISCORD_TOKEN as string);
