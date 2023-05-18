import { SlashCommandBuilder } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { autoCompleteStreamers } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";

const command = new SlashCommandBuilder()
  .setName("remove")
  .setDescription(
    "Removes a user to your subscription list in your current discord channel."
  );
// need to split this up for some reason
command.addStringOption((option) =>
  option
    .setName("streamer")
    .setDescription("The streamer to follow")
    .setRequired(true)
    .setAutocomplete(true)
);

const remove: CommandData = {
  command: command,
  autoComplete: autoCompleteStreamers,
  execute: async (interaction) => {
    const discordUser = new DiscordUser(interaction.user.id);

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

    // check if the subscription exists and remove it if it does
    const subscribed = await AppDataSource.getRepository(
      DiscordUserSubscription
    ).findOneBy(discordUserSub);
    if (subscribed) {
      await AppDataSource.getRepository(DiscordUserSubscription).remove(subscribed);
      await interaction.reply(`Successfully removed ${streamer.name}!`);
    } else {
      await interaction.reply(`You're not following ${streamer.name}!`);
      return;
    }
  },
};

export default remove;
