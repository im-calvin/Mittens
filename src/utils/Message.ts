import { TextChannel, userMention, roleMention, time } from "discord.js";
import { Video } from "../db/entity/Video.js";
import Sentry from "@sentry/node";
import { client } from "../bot.js";

/**
 * a formatter to send messages over discord
 * @param user_ids the user_ids to announce
 * @param channel_id the channel_id to announce in
 * @param video the video to announce about
 */
export async function announceStream(
  user_ids: string[],
  channel_id: string,
  video: Video,
  isLive: boolean
): Promise<void> {
  const transaction = Sentry.startTransaction({
    op: "announceStream",
    name: "Announces a stream to a channel",
  });
  const channel = client.channels.cache.get(channel_id) as TextChannel;

  // formatted as documented here: https://old.discordjs.dev/#/docs/discord.js/14.10.2/typedef/TimestampStylesString
  const absTime = time(video.scheduledTime, "f");
  const relTime = time(video.scheduledTime, "R");

  let mentions: string = "";
  for (let user_id of user_ids) {
    mentions = mentions.concat(userMention(user_id));
  }

  // get a list of all the users to mention
  await channel.send(`
    **${video.hostStreamer.name}** ${
    isLive ? "is now live!" : `scheduled a stream at ${absTime} / ${relTime}`
  }
    ${video.id}
    ${mentions}
  `);
  transaction.finish();
}
