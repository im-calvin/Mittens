import { SlashCommandBuilder, time, hyperlink, inlineCode } from "discord.js";
import { CommandData, autoCompleteStreamersGroupsLangs } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";
import { Group } from "../db/entity/Group.js";
import { Video } from "../db/entity/Video.js";
import { DataField, embedScheduleFormatter } from "../utils/Message.js";
import { MoreThan, Raw } from "typeorm";
import { Language } from "../db/entity/Language.js";
import { getStreamersByLanguage } from "../constants.js";

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

type VideoData = Pick<Video, "id" | "title" | "scheduledTime"> & {
  hostStreamerId: Video["hostStreamer"]["id"];
};

const schedule: CommandData = {
  command,
  autoComplete: autoCompleteStreamersGroupsLangs,
  execute: async (interaction) => {
    // decide if it was a streamer or a group or neither
    const streamerId = interaction.options.getString("streamer");
    const groupId = interaction.options.getString("group");
    const languageId = interaction.options.getString("language");
    const none = streamerId || groupId || languageId;

    if (none === null) {
      // show schedule for all upcoming
      const videos = await AppDataSource.getRepository(Video).find({
        where: {
          scheduledTime: MoreThan(new Date()),
        },
        order: {
          scheduledTime: "ASC",
        },
        relations: ["hostStreamer"],
      });
      const embedFields = videos.map((video) => ({
        name: `${time(video.scheduledTime, "f")} / ${time(video.scheduledTime, "R")}`,
        value: `${inlineCode(video.hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
      }));
      await embedScheduleFormatter(embedFields, interaction);
      return;
    } else if (streamerId !== null) {
      const streamer = await AppDataSource.getRepository(Streamer).findOneByOrFail({
        id: streamerId,
      });

      // TODO if I am able ot use the query builder then I can use types for the messaging, but video_participants it not a column?

      // const videos: Video[] = await AppDataSource.getRepository(Video)
      //   .createQueryBuilder("videos")
      //   .select("videos.id")
      //   .distinct(true)
      //   .leftJoin("video_participants", "video_participants")
      //   .where("videos.scheduledTime > datetime('now')")
      //   .andWhere("videos.hostStreamer = :streamer OR video_participants = :streamer", {
      //     streamer: streamer,
      //   })
      //   .orderBy("videos.scheduledTime", "ASC")
      //   .getMany();

      // const videos = (await AppDataSource.getRepository(Video)
      //   .createQueryBuilder("videos")
      //   .distinctOn(["videos.id"])
      //   .select("videos.id")
      //   .select("videos.title")
      //   .select("videos.scheduled_time", "scheduledTime")
      //   .select("videos.host_streamer_id", "hostStreamerId")
      //   .leftJoin("video_participants", "vp", "video_participants.video_id = videos.id")
      //   .andWhere("videos.scheduled_time > datetime('now')")
      //   .andWhere("videos.scheduled_time < datetime('now', '+10 day')")
      //   .andWhere((q) =>
      //     q
      //       .orWhere("videos.host_streamer_id = ?", [streamer.id])
      //       .orWhere("video_participants.participant_streamer_id = ?", [streamer.id])
      //   )
      //   .orderBy("videos.scheduled_time", "ASC")
      //   .execute()) as VideoData[];

      const videos = (await AppDataSource.query(
        `
      SELECT DISTINCT videos.id, videos.title, videos.scheduled_time "scheduledTime", videos.host_streamer_id "hostStreamerId"
      FROM videos
      LEFT JOIN video_participants ON video_participants.video_id = videos.id
      WHERE
        videos.scheduled_time > datetime('now')
        AND videos.scheduled_time < datetime('now', '+10 day')
        AND (
          videos.host_streamer_id = ?
          OR video_participants.participant_streamer_id = ?
        )
      ORDER BY videos.scheduled_time ASC
      `,
        [streamer.id, streamer.id]
      )) as VideoData[];

      const embedFields = await Promise.all(
        videos.map(async (video) => {
          const hostStreamer = await AppDataSource.getRepository(Streamer).findOneByOrFail({
            id: video.hostStreamerId,
          });
          return {
            name: `${time(new Date(video.scheduledTime), "f")} / ${time(
              new Date(video.scheduledTime),
              "R"
            )}`,
            value: `${inlineCode(hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
          };
        })
      );

      await embedScheduleFormatter(embedFields, interaction);
      return;
    } else if (groupId !== null) {
      const group = await AppDataSource.getRepository(Group).findOneByOrFail({
        id: Number(groupId), // the value from the autoComplete has to be casted to a string and hence it has to be casted back to a number here
      });
      const videos = (await AppDataSource.query(
        `
      SELECT DISTINCT videos.id, videos.title, videos.scheduled_time "scheduledTime", videos.host_streamer_id "hostStreamerId"
      FROM videos
      LEFT JOIN video_participants ON video_participants.video_id = videos.id
      LEFT JOIN streamers ON videos.host_streamer_id = streamers.id
      LEFT JOIN groups ON streamers.group_id = groups.id
      WHERE
        videos.scheduled_time > datetime('now')
        AND videos.scheduled_time < datetime('now', '+10 day')
        AND (
          groups.id = ?
        )
      ORDER BY videos.scheduled_time ASC
      `,
        [group.id]
      )) as VideoData[];

      const embedFields = await Promise.all(
        videos.map(async (video) => {
          const hostStreamer = await AppDataSource.getRepository(Streamer).findOneByOrFail({
            id: video.hostStreamerId,
          });
          return {
            name: `${time(new Date(video.scheduledTime), "f")} / ${time(
              new Date(video.scheduledTime),
              "R"
            )}`,
            value: `${inlineCode(hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
          };
        })
      );

      await embedScheduleFormatter(embedFields, interaction);
      return;
    } else if (languageId !== null) {
      const language = await AppDataSource.getRepository(Language).findOneBy({
        id: Number(languageId), // obligatory cast because discord.js requires value to be a string-type
      });
      if (language === null) return;
      const streamers = await getStreamersByLanguage(language); // all of the streamers related to a particular language

      // all of the videos related to the language
      const videos = await AppDataSource.getRepository(Video)
        .createQueryBuilder("video")
        .leftJoin("video.hostStreamer", "hostStreamer", "video.id = hostStreamer.video.id")
        .leftJoin(
          "video.participantStreamer",
          "participantStreamer",
          "video.id = participantStreamer.video.id"
        )
        .where("video.scheduledTime > :date", { date: new Date() })
        .andWhere("video.scheduledTime < :date", {
          date: new Date().setDate(new Date().getDate() + 10), // get current date + 10 days
        })
        .andWhere(
          "hostStreamer.language.id = :languageId OR participantStreamer.language.id = :languageId",
          { languageId: language.id }
        )
        .orderBy("video.scheduledTime", "ASC")
        .getMany();
      console.log(videos);
    }
    throw new Error("Not implemented");
  },
};

export default schedule;
