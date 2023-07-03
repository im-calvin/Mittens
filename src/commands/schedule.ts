import { SlashCommandBuilder } from "discord.js";
import { CommandData, autoCompleteStreamersGroupsLangs } from "../utils/cmdLoader.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";
import { Video } from "../db/entity/Video.js";
import { embedScheduleFormatter } from "../utils/Message.js";
import { Brackets, LessThan, MoreThan } from "typeorm";
import { getDateTenDaysAhead } from "../constants.js";

const command = new SlashCommandBuilder()
  .setName("schedule")
  .setDescription("Lists the upcoming streams for the given channel(s)");
command.addStringOption((option) =>
  option
    .setName("streamer")
    .setDescription("The streamer to find the upcoming streams for")
    .setAutocomplete(true)
);
command.addStringOption((option) =>
  option
    .setName("group")
    .setDescription("The group to find the upcoming streams for")
    .setAutocomplete(true)
);
command.addStringOption((option) =>
  option
    .setName("language")
    .setDescription("The specific org + language to find upcoming streams for")
    .setAutocomplete(true)
);

const schedule: CommandData = {
  command,
  autoComplete: autoCompleteStreamersGroupsLangs,
  execute: async (interaction) => {
    // decide if it was a streamer or a group or neither
    const streamerId = interaction.options.getString("streamer");
    const groupId = interaction.options.getString("group");
    const languageId = interaction.options.getString("language");

    if (!(streamerId || groupId || languageId)) {
      // show schedule for all upcoming
      const videos = await AppDataSource.getRepository(Video).find({
        where: [
          {
            scheduledTime: MoreThan(new Date()),
          },
        ],
        order: {
          scheduledTime: "ASC",
        },
        relations: ["hostStreamer"],
      });

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (streamerId !== null) {
      // show schedule for specific streamer
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .where("videos.scheduledTime > :date", { date: new Date() })
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
        .orderBy("videos.scheduledTime", "ASC")
        .take(25)
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (groupId !== null) {
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
        .where("videos.scheduledTime > :date", { date: new Date() })
        .andWhere("videos.scheduledTime < :tenDaysAhead", { tenDaysAhead: getDateTenDaysAhead() })
        .andWhere(
          new Brackets((qb) => {
            qb.where("hostStreamers.group_id = :groupId", { groupId }).orWhere(
              "participantStreamers.group_id = :groupId",
              { groupId }
            );
          })
        )
        .orderBy("videos.scheduledTime", "ASC")
        .take(25)
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else if (languageId !== null) {
      // all of the videos related to the language
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("videos")
        .leftJoin(
          Streamer,
          "participantStreamers",
          "participantStreamers.id IN (SELECT vp.participant_streamer_id FROM video_participants vp WHERE vp.video_id = videos.id)"
        )
        .leftJoin(Streamer, "hostStreamers", "videos.host_streamer_id = hostStreamers.id")
        // same result as eagerly loading foreign key tables
        .leftJoinAndSelect("videos.participantStreamers", "ps")
        .leftJoinAndSelect("videos.hostStreamer", "hs")
        .where("videos.scheduledTime > :date", { date: new Date() })
        .andWhere("videos.scheduledTime < :tenDaysAhead", { tenDaysAhead: getDateTenDaysAhead() })
        .andWhere(
          new Brackets((qb) => {
            qb.where("hostStreamers.language_id = :languageId", { languageId }).orWhere(
              "participantStreamers.language_id = :languageId",
              { languageId }
            );
          })
        )
        .orderBy("videos.scheduledTime", "ASC")
        .take(25)
        .getMany();

      await embedScheduleFormatter(videos, interaction);
      return;
    } else {
      throw new Error("Not implemented");
    }
  },
};

export default schedule;
