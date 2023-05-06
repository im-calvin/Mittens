import schedule from "node-schedule";
import members from "../../members.json" assert { type: "json" };
import { readEnv } from "./env.js";
import { AppDataSource } from "../db/data-source.js";
import { Video } from "../db/entity/Video.js";
import { Streamer } from "../db/entity/Streamer.js";
import { ToadScheduler, SimpleIntervalJob, Task, AsyncTask } from "toad-scheduler";
import { intervalTime } from "../constants.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { client } from "../bot.js";
import { Channel, TextChannel } from "discord.js";

const scheduler = new ToadScheduler();

AppDataSource.isInitialized ? null : await AppDataSource.initialize();

const videoRepo = AppDataSource.getRepository(Video);
const userRepo = AppDataSource.getRepository(DiscordUser);

/**
 * schedules a job to message users on discord about a particular video
 * @param date the time to schedule the job at
 */
export function scheduleJob(date: Date, video: Video) {
  const job = schedule.scheduleJob(date, async function () {
    // message users about a video
    // SELECT DiscordUser.user_id FROM DiscordUser INNER JOIN Streamer ON DiscordUser.user_id=Streamer.id INNER JOIN Video ON Streamer.id=Video.members WHERE Video.url="url goes here"

    const users: DiscordUser[] = await userRepo
      .createQueryBuilder("DiscordUser")
      // .innerJoin(Streamer, "Streamer", "DiscordUser.streamer_id = Streamer.id")
      .innerJoin(Video, "Video", "DiscordUser.streamer_ids=Video.members")
      .where(`Video.url = ${video.url}`)
      .select("DiscordUser.user_id")
      .getMany();

    let user: DiscordUser;
    for (user of users) {
      const channel = client.channels.cache.get(user.channel_id) as TextChannel;
      channel.send("hi");
    }
  });
}

const mems: string[] = [];
// load list of member
for (let member of members) {
  mems.push(member.id);
}

/**
 * periodically (based on intervalTime in constants.ts) scrapes Holodex and updates the database for videos
 */
export function scrape() {
  const task = new AsyncTask("scrape Holodex", async () => {
    // fetch all upcoming streams from holodex
    // relevant docs: https://holodex.stoplight.io/docs/holodex/f1e355dc4cb79-quickly-access-live-upcoming-for-a-set-of-channels
    const response = await fetch(
      `https://holodex.net/api/v2/users/live?channels=${mems.toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json", "X-APIKEY": readEnv("HOLODEX_API_KEY") },
      }
    );
    const videos = await response.json();

    // add the data to the db
    for (let video of videos) {
      // video_members is the Video.members field in the db
      const video_members = [];

      if (video.mentions !== undefined) {
        for (let channel of video.mentions) {
          video_members.push(channel.id);
        }
      }

      video_members.push(video.channel.id);

      const url = `https://youtube.com/watch?v=${video.id}`;
      const db_vid = new Video(
        url,
        new Date(video.available_at),
        video.title,
        video_members
      );

      try {
        // try to save, if it goes through then
        // 1. schedule the message & mention the users for the 1st ping
        // 3. add to the db
        await videoRepo.save(db_vid);
        scheduleJob(db_vid.scheduledTime, db_vid);
      } catch (err: unknown) {
        // TypeError = duplicate key
        // We want to continue on TypeError
        if (!(err instanceof TypeError)) {
          throw new Error("Unable to save video to database (not a duplicate key error)");
        }
      }
    }
  });

  const job = new SimpleIntervalJob(
    { minutes: intervalTime, runImmediately: true },
    task
  );

  scheduler.addSimpleIntervalJob(job);
  scheduleJob(
    new Date(new Date().getTime() + 2000),
    new Video("a", new Date(), "a", ["UCO_aKKYxn4tvrqPjcTzZ6EQ"])
  );
}
