import { SlashCommandBuilder } from "discord.js";
import { CommandData } from "../utils/cmdLoader.js";
import { autoCompleteStreamers } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";

const command = new SlashCommandBuilder()
  .setName("schedule")
  .setDescription("Lists the upcoming streams for the given channel(s)");
command.addStringOption((option) =>
  option
    .setName("streamer")
    .setDescription("The streamer to find the upcoming streams for")
    .setRequired(true)
    .setAutocomplete(true)
);

const schedule: CommandData = {
  command: command,
  autoComplete: () => {},
  execute: async (interaction) => {
    const discordUser = await AppDataSource.getRepository(DiscordUser).findOne({
      where: {
        id: interaction.user.id,
      },
    });
    if (!discordUser) {
      await interaction.reply("You have no subscriptions!");
      return;
    }

    const discordUserSubs = await AppDataSource.getRepository(DiscordUserSubscription).find({
      where: {
        discordUser: discordUser,
        discordChannelId: interaction.channelId,
      },
      relations: ["streamer"],
    });

    if (discordUserSubs.length === 0) {
      await interaction.reply("You have no subscriptions!");
      return;
    }

    const streamerNames = discordUserSubs.map((sub) => sub.streamer.name);
    await interaction.reply(`**Your subscriptions:** \n${streamerNames.join("\n")}`);
  },
};

export default schedule;
