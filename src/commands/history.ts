import { SlashCommandBuilder } from "discord.js";
import { CommandData, autoCompleteStreamersGroupsLangs } from "../utils/cmdLoader.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";
import { Video } from "../db/entity/Video.js";
import { embedScheduleFormatter } from "../utils/Message.js";
import { Brackets, LessThan, MoreThan } from "typeorm";
import { getDate7DaysBehind, getDateTenDaysAhead } from "../constants.js";
import { Group } from "../db/entity/Group.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";

const command = new SlashCommandBuilder()
  .setName("history")
  .setDescription("Lists the stream history for the given channel(s)");

command.addSubcommand((subcommand) =>
  subcommand
    .setName("language")
    .setDescription("Lists the stream history for the given language")
    .addStringOption((option) =>
      option
        .setName("language")
        .setDescription("The specific org + language to find stream history for")
        .setRequired(true)
        .setAutocomplete(true)
    )
);

command.addSubcommand((subcommand) =>
  subcommand
    .setName("streamer")
    .setDescription("Lists the stream history for the given streamer")
    .addStringOption((option) =>
      option
        .setName("streamer")
        .setDescription("The streamer to find the stream history for")
        .setRequired(true)
        .setAutocomplete(true)
    )
);

command.addSubcommand((subcommand) =>
  subcommand
    .setName("group")
    .setDescription("Lists the stream history for the given group")
    .addStringOption((option) =>
      option
        .setName("group")
        .setDescription("The group to find the stream history for")
        .setRequired(true)
        .setAutocomplete(true)
    )
);

command.addSubcommand((subCommand) =>
  subCommand
    .setName("following")
    .setDescription("Find the past streams for your following list in the current discord channel")
);

const history: CommandData = {
  command,
  autoComplete: autoCompleteStreamersGroupsLangs,
  execute: async (interaction) => {
    // decide if it was a streamer or a group or neither
    const streamerId = interaction.options.getString("streamer");
    const groupId = interaction.options.getString("group");
    const languageId = interaction.options.getString("language");
    const subCommandName = interaction.options.getSubcommand();

    if (!subCommandName) {
      // show schedule for all upcoming
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .leftJoinAndSelect("videos.hostStreamer", "hs")
        .where("videos.scheduledTime < :date", { date: new Date() })
        .andWhere("videos.scheduledTime > :sevenDaysBehind", {
          sevenDaysBehind: getDate7DaysBehind(),
        })
        .orderBy("videos.scheduledTime", "DESC")
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (subCommandName === "streamer") {
      // show schedule for specific streamer
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .where("videos.scheduledTime < :date", { date: new Date() })
        .andWhere("videos.scheduledTime > :sevenDaysBehind", {
          sevenDaysBehind: getDate7DaysBehind(),
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where("videos.hostStreamer.id = :streamerId", { streamerId }).orWhere(
              "videos.id IN (SELECT vp.video_id FROM video_participants vp WHERE vp.participant_streamer_id = :streamerId)",
              { streamerId }
            );
          })
        )
        .leftJoinAndSelect("videos.participantStreamers", "ps")
        .leftJoinAndSelect("videos.hostStreamer", "hs")
        .orderBy("videos.scheduledTime", "DESC")
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (subCommandName === "group") {
      // show schedule for a group
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .leftJoin(
          Streamer,
          "participantStreamers",
          "participantStreamers.id IN (SELECT vp.participant_streamer_id FROM video_participants vp WHERE vp.video_id = videos.id)"
        )
        .leftJoin(Streamer, "hostStreamers", "videos.host_streamer_id = hostStreamers.id")
        .leftJoinAndSelect("videos.participantStreamers", "ps")
        .leftJoinAndSelect("videos.hostStreamer", "hs")
        .where("videos.scheduledTime < :date", { date: new Date() })
        .andWhere("videos.scheduledTime > :sevenDaysBehind", {
          sevenDaysBehind: getDate7DaysBehind(),
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where("hostStreamers.group_id = :groupId", { groupId }).orWhere(
              "participantStreamers.group_id = :groupId",
              { groupId }
            );
          })
        )
        .orderBy("videos.scheduledTime", "DESC")
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (subCommandName === "language") {
      // all of the videos related to the language
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .leftJoin(
          Streamer,
          "participantStreamers",
          "participantStreamers.id IN (SELECT vp.participant_streamer_id FROM video_participants vp WHERE vp.video_id = videos.id)"
        )
        .leftJoin(Streamer, "hostStreamers", "videos.host_streamer_id = hostStreamers.id")
        .leftJoin(
          Group,
          "groups",
          "hostStreamers.group_id = groups.id OR participantStreamers.group_id = groups.id"
        )
        // same result as eagerly loading foreign key tables
        .leftJoinAndSelect("videos.participantStreamers", "ps")
        .leftJoinAndSelect("videos.hostStreamer", "hs")
        .where("videos.scheduledTime < :date", { date: new Date() })
        .andWhere("videos.scheduledTime > :sevenDaysBehind", {
          sevenDaysBehind: getDate7DaysBehind(),
        })
        .andWhere("groups.language_id = :languageId", { languageId })
        .orderBy("videos.scheduledTime", "DESC")
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (subCommandName === "following") {
      const discordUserId = interaction.user.id;
      const discordChannelId = interaction.channelId;
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .leftJoin(
          Streamer,
          "participantStreamers",
          "participantStreamers.id IN (SELECT vp.participant_streamer_id FROM video_participants vp WHERE vp.video_id = videos.id)"
        )
        .leftJoin(Streamer, "hostStreamers", "videos.host_streamer_id = hostStreamers.id")
        .leftJoin(
          DiscordUserSubscription,
          "discordUserSubs",
          "hostStreamers.id = discordUserSubs.streamer_id OR participantStreamers.id = discordUserSubs.streamer_id"
        )
        // same result as eagerly loading foreign key tables
        .leftJoinAndSelect("videos.participantStreamers", "ps")
        .leftJoinAndSelect("videos.hostStreamer", "hs")
        .where("videos.scheduledTime < :date", { date: new Date() })
        .andWhere("videos.scheduledTime > :sevenDaysBehind", {
          sevenDaysBehind: getDate7DaysBehind(),
        })
        .andWhere("discordUserSubs.discord_user_id = :discordUserId", { discordUserId })
        .andWhere("discordUserSubs.discord_channel_id = :discordChannelId", { discordChannelId })
        .orderBy("videos.scheduledTime", "DESC")
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else {
      throw new Error("Not implemented");
    }
  },
};

export default history;
