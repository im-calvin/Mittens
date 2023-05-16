import schedule from "node-schedule";
import { readEnv } from "./env.js";
import { AppDataSource } from "../db/data-source.js";
import { Video } from "../db/entity/Video.js";
import { Streamer } from "../db/entity/Streamer.js";
import { ToadScheduler, SimpleIntervalJob, AsyncTask } from "toad-scheduler";
import { intervalTime } from "../constants.js";
import Sentry from "@sentry/node";
import { announceStream } from "./Message.js";
import { HolodexChannel, HolodexVideo } from "./Holodex.js";
import { DiscordUserSubscription } from "../db/entity/DiscordUserSubscription.js";
import { VideoParticipant } from "../db/entity/VideoParticipant.js";

const scheduler = new ToadScheduler();

const videoRepo = AppDataSource.getRepository(Video);
const subRepo = AppDataSource.getRepository(DiscordUserSubscription);
const streamerRepo = AppDataSource.getRepository(Streamer);
const participantRepo = AppDataSource.getRepository(VideoParticipant);

/**
 * schedules a job to message users on discord about a particular video
 * @param date the time to schedule the job at
 * @param video the video to message about
 */
export function scheduleJob(date: Date, video: Video) {
  // message users about a video
  const job = schedule.scheduleJob(date, async function () {
    // get all users that follow the members that partipate in the video
    const channelSubs = await getChannelSubs(video);
    Promise.all(
      Array.from(channelSubs.entries()).map(async ([channelId, userIds]) => {
        await announceStream(userIds, channelId, video);
      })
    );
  });
}

/**
 * periodically (based on intervalTime in constants.ts) scrapes Holodex and updates the database for videos
 */
export async function scrape() {
  const transaction = Sentry.startTransaction({
    op: "scrapeHolodex",
    name: "Scrapes Holodex for new Videos and schedules job to announce them",
  });

  // load list of member
  const streamers = await streamerRepo.find({
    relations: {
      group: true,
      subcriptions: true,
    },
  });

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
    for (const video of videos) {
      if (video.channel.org !== "Hololive") {
        continue; // TODO find a better workaround. Issue: when the original video creator is not from Hololive, the streamer isn't in the db and then it crashes
      }
      // videoMembers is the Video.members field in the db
      const videoMembers: HolodexChannel[] = [];

      // add the mentioned members (if it exists) to the videoMembers arr
      if (video.mentions !== undefined) {
        for (const channel of video.mentions) {
          videoMembers.push(channel);
        }
      }

      // get the original channel
      videoMembers.push(video.channel);
      const streamer = await streamerRepo.findOneOrFail({
        where: {
          id: video.channel.id,
        },
      });

      const url = `https://youtube.com/watch?v=${video.id}`;
      const db_vid = new Video(url, new Date(video.available_at), video.title, streamer);

      // check to see if video is in db
      const maybeVideo = await videoRepo.findOne({
        where: {
          id: db_vid.id,
        },
      });
      // if video is not in db then
      if (maybeVideo === null) {
        // try to save, if it goes through then
        // 1. schedule the message & mention the users for the 1st ping
        // 3. add to the db
        await videoRepo.save(db_vid);
        // TODO check that this also updates video_participants table
        // if successful:
        // update the video_participants table
        for (const vid_streamer of videoMembers) {
          const db_streamer = await streamerRepo.findOneByOrFail({
            id: vid_streamer.id,
          });
          const participant = new VideoParticipant(db_vid, db_streamer);
          await participantRepo.save(participant);
        }

        // mention users for the 1st ping
        scheduleJob(new Date(), db_vid);
        // schedule job for the video
        scheduleJob(db_vid.scheduledTime, db_vid);
      }
    }
  });

  const job = new SimpleIntervalJob(
    { minutes: intervalTime, runImmediately: true },
    task
  );

  scheduler.addSimpleIntervalJob(job);
  transaction.finish();
}

/**
 * gets all of the discord users that follow the streamers in the video
 * @param video the video to get the users for
 * @returns a map of discord channel ids to the users that follow the streamers in the video
 */
async function getChannelSubs(video: Video): Promise<Map<string, string[]>> {
  const transaction = Sentry.startTransaction({
    op: "getChannelSubs",
    name: "Gets all of the discord users that follow the streamers in the video",
  });

  let streamers = [];
  if (video.participantStreamers === undefined) {
    streamers = [video.hostStreamer];
  } else {
    streamers = [
      video.hostStreamer,
      ...video.participantStreamers.map((p) => p.streamer),
    ];
  }
  const channelSubs = new Map<string, string[]>();

  // iterate over the users and send messages in the respective channels
  // group users based on their channel_ids (send one message that pings multiple in 1 channel)
  for (const streamer of streamers) {
    const subscriptions = await subRepo.find({
      where: {
        streamer: streamer,
      },
    });
    // TODO check the casting
    for (const sub of subscriptions) {
      const channelUsers = channelSubs.get(sub.discordChannelId);
      if (channelUsers === undefined) {
        channelSubs.set(sub.discordChannelId, [sub.id as unknown as string]);
      } else {
        channelSubs.set(sub.discordChannelId, [
          ...channelUsers,
          sub.id as unknown as string,
        ]);
      }
    }
  }
  transaction.finish();

  return channelSubs;
}
