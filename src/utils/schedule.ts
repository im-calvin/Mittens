import schedule from "node-schedule";
import { readEnv } from "./env.js";
import { AppDataSource } from "../db/data-source.js";
import { Video } from "../db/entity/Video.js";
import { Streamer } from "../db/entity/Streamer.js";
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from "toad-scheduler";
import { intervalTime } from "../constants.js";
import { DiscordUser } from "../db/entity/DiscordUser.js";
import { announceStream } from "./Message.js";
import { HolodexVideo } from "./Holodex.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { VideoParticipant } from "../db/entity/VideoParticipant.js";

const scheduler = new ToadScheduler();

AppDataSource.isInitialized ? null : await AppDataSource.initialize();

const videoRepo = AppDataSource.getRepository(Video);
const userRepo = AppDataSource.getRepository(DiscordUser);
const subRepo = AppDataSource.getRepository(DiscordUserSubscription);
const streamerRepo = AppDataSource.getRepository(Streamer);
const participantRepo = AppDataSource.getRepository(VideoParticipant);

/**
 * schedules a job to message users on discord about a particular video
 * @param date the time to schedule the job at
 * @param video the video to message about
 */
export function scheduleJob(date: Date, video: Video) {
  const job = schedule.scheduleJob(date, async function () {
    // message users about a video

    // get all users that follow the members that partipate in the video
    // const hostSubscriptions = video.hostStreamer.subcriptions;
    // const participantSubscriptions = video.participantStreamers.flatMap(
    //   (s) => s.subcriptions
    // );
    // const subscriptions = [...hostSubscriptions, ...participantSubscriptions];
    // console.log(users);

    const streamers = [video.hostStreamer, video.participantStreamers];
    const channelSubs = new Map();

    // iterate over the users and send messages in the respective channels
    // group users based on their channel_ids (send one message that pings multiple in 1 channel)
    for (const streamer of streamers) {
      const subscriptions = await subRepo.find({
        where: {
          streamer: streamer,
        },
      });
      // TODO make this better ?
      for (const sub of subscriptions) {
        const channelUsers = channelSubs.get(sub);
        channelSubs.set(sub.discordChannelId, [...channelUsers, sub.id]);
      }
    }

    channelSubs.forEach(async (userIds, channelId) => {
      // select all users that are in a subscription
      await announceStream(userIds, channelId, video);
    });
  });
}

// load list of member
const streamers = await streamerRepo.find({
  relations: {
    group: true,
    subcriptions: true,
  },
});

/**
 * periodically (based on intervalTime in constants.ts) scrapes Holodex and updates the database for videos
 */
export function scrape() {
  const task = new AsyncTask("scrape Holodex", async () => {
    // fetch all upcoming streams from holodex
    // relevant docs: https://holodex.stoplight.io/docs/holodex/f1e355dc4cb79-quickly-access-live-upcoming-for-a-set-of-channels
    const response = await fetch(
      `https://holodex.net/api/v2/users/live?channels=${streamers
        .map((s) => s.id)
        .toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json", "X-APIKEY": readEnv("HOLODEX_API_KEY") },
      }
    );
    const videos: HolodexVideo[] = await response.json();

    // add the data to the db
    for (let video of videos) {
      if (video.channel.org !== "Hololive") {
        break; // TODO find a better workaround. Issue: when the original video creator is not from Hololive, the streamer isn't in the db and then it crashes
      }
      // videoMembers is the Video.members field in the db
      const videoMembers = [];

      // add the mentioned members (if it exists) to the videoMembers arr
      if (video.mentions !== undefined) {
        for (let channel of video.mentions) {
          videoMembers.push(channel.id);
        }
      }

      // get the original channel
      videoMembers.push(video.channel.id);
      const streamer = await streamerRepo.findOneOrFail({
        where: {
          id: video.channel.id,
        },
      });

      const url = `https://youtube.com/watch?v=${video.id}`;
      const db_vid = new Video(url, new Date(video.available_at), video.title, streamer);

      try {
        // try to save, if it goes through then
        // 1. schedule the message & mention the users for the 1st ping
        // 3. add to the db
        await videoRepo.save(db_vid);
        // TODO check that this also updates video_participants table
        // if successful:
        // update the video_participants table
        for (const streamer of db_vid.participantStreamers) {
          const participant = new VideoParticipant(db_vid, streamer);
          await participantRepo.save(participant);
        }
        await scheduleJob(db_vid.scheduledTime, db_vid);
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
}
