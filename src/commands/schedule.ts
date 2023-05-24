import { SlashCommandBuilder } from "discord.js";
import { CommandData, autoCompleteStreamersGroups } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";
import { Group } from "src/db/entity/Group.js";
import { Video } from "src/db/entity/Video.js";

const command = new SlashCommandBuilder()
  .setName("schedule")
  .setDescription("Lists the upcoming streams for the given channel(s)");
command.addStringOption((option) =>
  option
    .setName("streamer/group")
    .setDescription("The streamer/group to find the upcoming streams for")
    .setRequired(true)
    .setAutocomplete(true)
);

const schedule: CommandData = {
  command: command,
  autoComplete: autoCompleteStreamersGroups,
  execute: async (interaction) => {
    // decide if it was a streamer or a group
    const streamer = await AppDataSource.getRepository(Streamer).findOne({
      where: {
        id: interaction.options.getString("streamer/group", true),
      },
    });
    if (streamer !== null) {
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("video")
        .where("video.host_streamer_id = :streamerId");
    }
    const group = await AppDataSource.getRepository(Group).findOne({
      where: {
        id: interaction.options.getString("streamer/group", true) as unknown as number, // suspicious casting
      },
    });
    if (group !== null) {
    }
  },
};

export default schedule;
