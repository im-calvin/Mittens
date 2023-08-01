import { GatewayIntentBits, Events, Message, PartialMessage } from "discord.js";
import MittensClient from "./utils/Client.js";
import { handleTranslate } from "./translate/Translate.js";
import Sentry from "@sentry/node";
import { readEnv } from "./utils/env.js";
import { init, kuroshiro } from "./init.js";
import { scrape } from "./utils/schedule.js";
import { AppDataSource } from "./db/data-source.js";
import { GuildTranslate } from "./db/entity/GuildTranslate.js";
import { CMD_PREFIX } from "./constants.js";

await init();

const boot = Sentry.startTransaction({
  op: "boot",
  name: "First time launch of Mittens",
});

const guildTranslateRepo = AppDataSource.getRepository(GuildTranslate);

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

  // defer reply
  await interaction.deferReply();

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
  // if dm
  if (!message.guildId) {
    return;
  }
  // if the admins turned off translating in their server
  // the database should always have a guild in it because the db gets updated every time mittens joins a guild
  const guildTranslate = await guildTranslateRepo.findOneByOrFail({
    discordGuildId: message.guildId,
  });
  if (!guildTranslate.status) {
    return;
  }

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

  // check for CMD_PREFIX (used for $kana)
  if (message.content.startsWith(CMD_PREFIX)) {
    const cmd = message.content.substring(1);
    switch (cmd) {
      case "kana":
        const hasReference = message.reference;
        if (hasReference) {
          const reference = await message.fetchReference();
          const convertedMessage = await kuroshiro.convert(reference.content, {
            to: "hiragana",
            mode: "okurigana",
            delimiter_start: "「",
            delimiter_end: "」",
          });
          await message.channel.send(convertedMessage);
        } else {
          await message.channel.send("You need to reply to a message!");
        }
        return;
      default:
        await message.channel.send(`No command called ${cmd} found!`);
        return; // don't translate if the message starts with '$'
    }
  }

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

// handle joining a guild (for toggling translate)
// set default for translation to be false
client.on(Events.GuildCreate, (guild) => {
  const transaction = Sentry.startTransaction({
    op: "guildCreate",
    name: "Mittens added to a new guild",
  });
  const guildTranslate = new GuildTranslate();
  guildTranslate.status = false;
  guildTranslate.discordGuildId = guild.id;

  guildTranslateRepo.insert(guildTranslate);
  transaction.finish();
});

client.login(readEnv("DISCORD_TOKEN"));
boot.finish();
