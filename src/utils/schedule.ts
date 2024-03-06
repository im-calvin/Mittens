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

/**
 * schedules a job to message users on discord about a particular video
 * @param date the time to schedule the job at
 * @param video the video to message about
 */
export function scheduleAnnounce(date: Date, video: Video, isLive: boolean) {
  // message users about a video
  const job = schedule.scheduleJob(date, async function () {
    // trip live_pinged flag to be true (issue #39)
    video.livePinged = true;
    videoRepo.save(video);

    // get all users that follow the members that partipate in the video
    const newVideo = await videoRepo.findOneOrFail({
      where: {
        id: video.id,
      },
      relations: {
        participantStreamers: {
          streamer: true,
        },
        hostStreamer: true,
      },
    });
    const channelSubs = await getChannelSubs(newVideo);
    await Promise.all(
      Array.from(channelSubs.entries()).map(async ([channelId, userIds]) => {
        await announceStream(userIds, channelId, newVideo, isLive);
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
      `https://holodex.net/api/v2/users/live?channels=${streamers.map((s) => s.id).toString()}`,
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
      let videoMembers: HolodexChannel[] = [];

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
      db_vid.livePinged = false;

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

        // TODO for egora: is there a better way of optimizing saves and fetches from the database than doing them manually like this (cascade option in save?)
        // if successful:
        // update the video_participants table
        const participants = [];
        if (video.mentions !== undefined) {
          for (const vid_streamer of video.mentions) {
            const db_streamer = await streamerRepo.findOneBy({
              id: vid_streamer.id,
            });
            if (db_streamer === null) continue; // if hoster was hololive, but it was a collab with outside of hololive, then streamer won't be in repo and then continue
            const participant = new VideoParticipant(db_vid, db_streamer);
            participants.push(participant);
          }
        }
        db_vid.participantStreamers = participants;

        await videoRepo.save(db_vid);

        // mention users for the 1st ping
        const channelSubs = await getChannelSubs(db_vid);
        await Promise.all(
          Array.from(channelSubs.entries()).map(async ([channelId, userIds]) => {
            await announceStream(userIds, channelId, db_vid, false);
          })
        );
        // schedule job for the video
        scheduleAnnounce(db_vid.scheduledTime, db_vid, true);
      } else {
        // if video is in db then update it with the new data
        maybeVideo.scheduledTime = db_vid.scheduledTime;
        maybeVideo.title = db_vid.title;
        maybeVideo.hostStreamer = db_vid.hostStreamer;
        maybeVideo.participantStreamers = db_vid.participantStreamers;
        await videoRepo.save(maybeVideo);
      }
    }
  });

  const job = new SimpleIntervalJob({ minutes: intervalTime, runImmediately: true }, task);

  scheduler.addSimpleIntervalJob(job);
  transaction.end();
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

  const streamers = [
    video.hostStreamer,
    // get all unique participant streamers
    ...[...new Set(video.participantStreamers.map((p) => p.streamer))], // make participant streamers unique
  ];

  const channelSubs = new Map<string, string[]>();

  // iterate over the users and send messages in the respective channels
  // group users based on their channel_ids (send one message that pings multiple in 1 channel)
  for (const streamer of streamers) {
    const subscriptions = await subRepo.find({
      where: {
        streamer: streamer,
      },
    });
    for (const sub of subscriptions) {
      const channelUsers = channelSubs.get(sub.discordChannelId) || [];
      channelSubs.set(sub.discordChannelId, [...channelUsers, sub.discordUser.id]);
    }
  }
  transaction.end();

  return channelSubs;
}
