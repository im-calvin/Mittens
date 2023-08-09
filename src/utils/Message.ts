import {
  TextChannel,
  userMention,
  time,
  hyperlink,
  inlineCode,
  EmbedBuilder,
  ChatInputCommandInteraction,
} from "discord.js";
import { Video } from "../db/entity/Video.js";
import Sentry from "@sentry/node";
import { client } from "../bot.js";
import { Pagination } from "pagination.djs";

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
  const channel = await client.channels.fetch(channel_id);
  if (!(channel instanceof TextChannel)) {
    throw new Error(
      `Channel id of ${channel} not found. Either the client is missing access or channel id is unknown.`
    ); //
  }

  // formatted as documented here: https://old.discordjs.dev/#/docs/discord.js/14.10.2/typedef/TimestampStylesString
  const absTime = time(video.scheduledTime, "f");
  const relTime = time(video.scheduledTime, "R");

  let mentions: string = "";
  const mentionSet = new Set<string>(user_ids);
  for (let user_id of mentionSet) {
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

export async function embedScheduleFormatter(
  videos: Video[],
  interaction: ChatInputCommandInteraction
) {
  // @ts-ignore reference: https://github.com/imranbarbhuiya/pagination.djs/issues/177
  const pagination = new Pagination(interaction);

  const embedFields = videos.map((video) => ({
    name: `${time(video.scheduledTime, "f")} / ${time(video.scheduledTime, "R")}`,
    value: `${inlineCode(video.hostStreamer.name)}: ${hyperlink(video.title, video.id)}`,
  }));

  pagination.setColor(0xfcc174);
  pagination.setTitle("Schedule");
  pagination.setFields(embedFields);
  pagination.paginateFields(true);
  // From docs: By default render() will reply() to the interaction. But if the interaction is already replied or deferred then it'll editReply() instead
  pagination.render();
}
export interface DataField {
  name: string;
  value: string;
}
