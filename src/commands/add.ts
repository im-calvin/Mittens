import { SlashCommandBuilder } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { autoCompleteStreamers } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";

const command = new SlashCommandBuilder()
  .setName("add")
  .setDescription("Adds a user to your subscription list in your current channel.");
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
    await AppDataSource.getRepository(DiscordUser).save(discordUser);

    const streamer = await AppDataSource.getRepository(Streamer).findOneOrFail({
      where: {
        name: interaction.options.getString("streamer", true), // TODO this is unsafe because name is not a primary key hence there could be multiple?
      },
    });
    // TODO for egora: is there a better way of optimizing saves and fetches from the database than doing them manually like this (cascade option in save?)
    const discordUserSub = new DiscordUserSubscription(
      discordUser,
      interaction.channelId,
      streamer
    );

    // allow the user to subscribe to the streamer even if they are already subscribed (because it will just update if it already exists)
    await AppDataSource.getRepository(DiscordUserSubscription).save(discordUserSub);
    await interaction.reply("Successfully added a user!");
  },
};

export default add;
