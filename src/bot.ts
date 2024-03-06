import { GatewayIntentBits, Events, Message, PartialMessage, userMention } from "discord.js";
import MittensClient from "./utils/Client.js";
import { handleTranslate } from "./translate/Translate.js";
import Sentry from "@sentry/node";
import { readEnv } from "./utils/env.js";
import { dbInit, monitoringInit, kuroshiro } from "./init.js";
import { scrape } from "./utils/schedule.js";
import { AppDataSource } from "./db/data-source.js";
import { GuildTranslate } from "./db/entity/GuildTranslate.js";
import { CMD_PREFIX } from "./constants.js";

// need to first init the client because some migrations in init() depend on client being up
export const client = new MittensClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
});

await monitoringInit();

const boot = Sentry.startTransaction({
  op: "boot",
  name: "First time launch of Mittens",
});

const guildTranslateRepo = AppDataSource.getRepository(GuildTranslate);

// on boot
client.once("ready", async () => {
  await dbInit();
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
  transaction.end();
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
  transaction.end();
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

  if (
    message.author.id === client.user!.id ||
    message.author.bot ||
    message.content.startsWith("::") ||
    message.content === ""
  )
    return;

  if (message.mentions.has(client.user!)) {
    await message.channel.send("meow");
  }

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
});

// handle translating edits
client.on(
  Events.MessageUpdate,
  async (
    oldMessage: Message<boolean> | PartialMessage,
    newMessage: Message<boolean> | PartialMessage
  ) => {
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
  transaction.end();
});

// randomly ping certain users to troll them in a particular channel
const trollUsers = [
  "218854936539037697", // kevin
  // "277242405684641794", // derk
  "554202008882511872", // izzy
  "254235152341925888", // lsr
];
const interval = 12 * 60 * 60 * 1000; // half a day in milliseconds
const channelId = "1213400628739579924";
const guildId = "1099897092366942300";

setInterval(() => {
  const randomUser = trollUsers[Math.floor(Math.random() * trollUsers.length)];
  const guild = client.guilds.cache.get(guildId);
  if (guild) {
    const channel = guild.channels.cache.get(channelId);
    if (channel && channel.isTextBased()) {
      const member = guild.members.cache.find((member) => member.user.id === randomUser);
      if (member) {
        channel.send(`Wished by ${userMention(member.user.id)}`);
      }
    }
  }
}, interval);

client.login(readEnv("DISCORD_TOKEN"));
boot.end();
