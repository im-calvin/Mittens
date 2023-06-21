import {
  GatewayIntentBits,
  Events,
  BaseInteraction,
  Message,
  Awaitable,
  PartialMessage,
  MessageManager,
} from "discord.js";
import MittensClient from "./utils/Client.js";
import { handleTranslate } from "./translate/Translate.js";
import Sentry from "@sentry/node";
import { readEnv } from "./utils/env.js";
import { init } from "./init.js";
import { scrape } from "./utils/schedule.js";

await init();

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
client.once("ready", async () => {
  await scrape();
  console.log("もしもし");
});

// handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
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

// handle autocomplete
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isAutocomplete()) return;
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  const transaction = Sentry.startTransaction({
    op: "autocomplete",
    name: "Autocomplete interaction",
  });

  try {
    await command.autoComplete(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}`);
    console.error(error);
  }
  transaction.finish();
});

// handle translating
client.on(Events.MessageCreate, async (message: Message) => {
  const transaction = Sentry.startTransaction({
    op: "msgCreate",
    name: "Message creation interaction",
  });
  if (
    message.author.id === client.user!.id ||
    message.author.bot ||
    message.content.startsWith("::") ||
    message.content === ""
  )
    return;
  const translatedText = await handleTranslate(message);

  if (translatedText) {
    const myMessage = await message.channel.send(translatedText);
    client.messageCache.set(message.id, myMessage.id);
  }
  transaction.finish();
});

// handle translating edits
client.on(
  Events.MessageUpdate,
  async (
    oldMessage: Message<boolean> | PartialMessage,
    newMessage: Message<boolean> | PartialMessage
  ) => {
    const transaction = Sentry.startTransaction({
      op: "msgUpdate",
      name: "Message update interaction",
    });

    if (oldMessage.partial || newMessage.partial) {
      return; // partials are not enabled
    }

    if (
      oldMessage.author.id === client.user!.id ||
      oldMessage.author.bot ||
      oldMessage.content.startsWith("::")
    )
      return;

    const translatedText = await handleTranslate(newMessage);
    if (translatedText) {
      const myOldMessageId = client.messageCache.get(oldMessage.id);
      if (myOldMessageId)
        // fetch the old message that I sent and edit it
        (await oldMessage.channel.messages.fetch(myOldMessageId)).edit(translatedText);
    }
    transaction.finish();
  }
);

client.login(readEnv("DISCORD_TOKEN"));
boot.finish();
