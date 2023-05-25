import { SlashCommandBuilder, time, hyperlink, inlineCode } from "discord.js";
import { CommandData, autoCompleteStreamersGroups } from "../utils/cmdLoader.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { AppDataSource } from "../db/data-source.js";
import { Streamer } from "../db/entity/Streamer.js";
import { Group } from "../db/entity/Group.js";
import { Video } from "../db/entity/Video.js";
import { DataField, embedScheduleFormatter } from "../utils/Message.js";
import { Raw } from "typeorm";

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

const schedule: CommandData = {
  command: command,
  autoComplete: autoCompleteStreamersGroups,
  execute: async (interaction) => {
    // decide if it was a streamer or a group or neither
    const streamerName = interaction.options.getString("streamer");
    const groupName = interaction.options.getString("group");
    const none = streamerName || groupName;

    if (none === null) {
      // show schedule for all upcoming
      const videos = await AppDataSource.getRepository(Video).find({
        where: {
          scheduledTime: Raw((alias) => `${alias} > datetime('now')`),
        },
        order: {
          scheduledTime: "ASC",
        },
        relations: ["hostStreamer"],
      });
      const embedFields: DataField[] = videos.map((video) => ({
        name: `${time(video.scheduledTime, "f")} / ${time(video.scheduledTime, "R")}`,
        value: `${inlineCode(video.hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
      }));
      await embedScheduleFormatter(embedFields, interaction);
      return;
    } else if (streamerName !== null) {
      const streamer = await AppDataSource.getRepository(Streamer).findOneByOrFail({
        id: streamerName,
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
      const videos: any[] = await AppDataSource.query(
        `
      SELECT DISTINCT videos.id, videos.title, videos.scheduled_time, videos.host_streamer_id
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
        [streamer.id]
      );

      const embedFields: DataField[] = await Promise.all(
        videos.map(async (video) => {
          const hostStreamer = await AppDataSource.getRepository(Streamer).findOneByOrFail({
            id: video.host_streamer_id,
          });
          return {
            name: `${time(new Date(video.scheduled_time), "f")} / ${time(
              new Date(video.scheduled_time),
              "R"
            )}`,
            value: `${inlineCode(hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
          };
        })
      );

      await embedScheduleFormatter(embedFields, interaction);
      return;
    } else if (groupName !== null) {
      const group = await AppDataSource.getRepository(Group).findOneByOrFail({
        id: Number(groupName), // the value from the autoComplete has to be casted to a string and hence it has to be casted back to a number here
      });
      const videos: any[] = await AppDataSource.query(
        `
      SELECT DISTINCT videos.id, videos.title, videos.scheduled_time, videos.host_streamer_id
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
      );

      const embedFields: DataField[] = await Promise.all(
        videos.map(async (video) => {
          const hostStreamer = await AppDataSource.getRepository(Streamer).findOneByOrFail({
            id: video.host_streamer_id,
          });
          return {
            name: `${time(new Date(video.scheduled_time), "f")} / ${time(
              new Date(video.scheduled_time),
              "R"
            )}`,
            value: `${inlineCode(hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
          };
        })
      );

      await embedScheduleFormatter(embedFields, interaction);
      return;
    }
    throw new Error("Not implemented");
  },
};

export default schedule;
