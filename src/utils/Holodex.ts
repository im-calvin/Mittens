import { readEnv } from "./env.js";
import Sentry from "@sentry/node";

export interface HolodexChannel {
  id: string;
  name: string;
  english_name: string | null;
  type: "vtuber" | "subber";
  org: "Hololive" | string | null;
  group: string | null;
  photo: string | null;
  banner: string | null;
  twitter: string | null;
  video_count: string | null;
  subscriber_count: string | null;
  view_count: string | null;
  clip_count: string | null;
  lang: string | null;
  published_at: string; // datetime
  inactive: boolean;
  description: string;
}

export interface HolodexVideo {
  id: string;
  title: string;
  type: "stream" | "clip";
  topic_id: string | null;
  published_at: string | null; // datetime
  available_at: string; // datetime
  duration: number;
  status: "new" | "upcoming" | "live" | "past" | "missing";
  start_scheduled: string | null; // datetime
  start_actual: string | null; // datetime
  end_actual: string | null; // datetime
  live_viewers: number | null;
  description: string;
  songcount: number;
  channel_id: string;
  mentions: HolodexChannel[] | undefined;
  channel: HolodexChannel;
}

/**
 *
 * @returns a list of all the channels in Holodex from Hololive
 */
export async function getHoloChannels(): Promise<HolodexChannel[]> {
  const transaction = Sentry.startTransaction({
    op: "getHoloChannels",
    name: "Gets all the channels in Holodex",
  });
  const res: HolodexChannel[] = [];

  let offset = 0;

  let data: HolodexChannel[] = [];

  const options = {
    method: "GET",
    headers: { Accept: "application/json", "X-APIKEY": readEnv("HOLODEX_API_KEY") },
  };

  do {
    // get the list of channels and put it into the db
    let url = `https://holodex.net/api/v2/channels?type=vtuber&org=Hololive&offset=${offset}`;
    let response = await fetch(url, options);
    data = await response.json();
    res.push(...data);
    offset += 25;
  } while (data.length !== 0);

  transaction.finish();
  return res;
}
