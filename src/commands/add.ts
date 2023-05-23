import { SlashCommandBuilder } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { autoCompleteStreamers } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";

const command = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Adds a user to your subscription list in your current discord channel.");
// need to split this up for some reason
command.addStringOption((option) =>
  option
    .setName("streamer")
    .setDescription("The streamer to follow")
    .setRequired(true)
    .setAutocomplete(true)
);

const add: CommandData = {
  command: command,
  autoComplete: autoCompleteStreamers,
  execute: async (interaction) => {
    const discordUser = new DiscordUser(interaction.user.id);
    await AppDataSource.getRepository(DiscordUser).upsert(discordUser, ["id"]);

    const streamer = await AppDataSource.getRepository(Streamer).findOne({
      where: {
        id: interaction.options.getString("streamer", true),
      },
    });
    if (streamer === null) {
      await interaction.reply("Streamer not found!");
      return;
    }
    // TODO for egora: is there a better way of optimizing saves and fetches from the database than doing them manually like this (cascade option in save?)
    const discordUserSub = new DiscordUserSubscription(
      discordUser,
      interaction.channelId,
      streamer
    );

    // subscribe the user and err if they are already subscribed
    const subscribed = await AppDataSource.getRepository(DiscordUserSubscription).findOneBy(
      discordUserSub
    );
    if (subscribed) {
      await interaction.reply(`You are already subscribed to ${streamer.name}!`);
      return;
    } else {
      await AppDataSource.getRepository(DiscordUserSubscription).insert(discordUserSub);
      await interaction.reply(`Successfully added ${streamer.name}!`);
    }
  },
};

export default add;
