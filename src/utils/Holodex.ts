export interface HolodexChannel {
  id: string;
  name: string;
  english_name: string | null;
  type: "vtuber" | "subber";
  org: string | null;
  suborg: string | null;
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

// get the list of channels and put it into the db
const url = 'https://holodex.net/api/v2/channels?type=vtuber&org=Hololive';
const options = {
  method: 'GET',
  headers: {Accept: 'application/json', 'X-APIKEY': '8eed9e38-769c-4907-9fe7-d7bcac20f21c'}
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}