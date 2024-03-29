import Sentry from "@sentry/node";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { AppDataSource } from "./db/data-source.js";
import { readEnv } from "./utils/env.js";
import { Video } from "./db/entity/Video.js";
import { MoreThan } from "typeorm";
import { scheduleAnnounce } from "./utils/schedule.js";
import { client } from "./bot.js";

export const kuroshiro = new Kuroshiro();

export async function monitoringInit(): Promise<void> {
  // inits Sentry
  Sentry.init({
    dsn: "https://c9c992d5a347411db99537a0ed2c0094@o4505106964742144.ingest.sentry.io/4505106967691264",
    integrations: [...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    release: "mittens@" + readEnv("npm_package_version"),
  });

  await kuroshiro.init(new KuromojiAnalyzer());
}

export async function dbInit(): Promise<void> {
  // start the db & run migrations
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  // query the videos table for scheduledTime > now and livePinged == False, take those videos and then schedule pings
  const videoRepo = AppDataSource.getRepository(Video);
  const videos = await videoRepo.findBy({
    scheduledTime: MoreThan(new Date()),
    livePinged: false,
  });
  for (const video of videos) {
    scheduleAnnounce(video.scheduledTime, video, true);
  }
}
