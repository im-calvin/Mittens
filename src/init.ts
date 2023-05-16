import Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";
import { AppDataSource } from "./db/data-source.js";
import profiles from "../profiles.json" assert { type: "json" };
import { Streamer } from "./db/entity/Streamer.js";
import { DiscordUser } from "./db/entity/DiscordUser.js";
import { DiscordUserSubscription } from "./db/entity/DiscordUserSubscription.js";

export async function init(): Promise<void> {
  // inits Sentry
  Sentry.init({
    dsn: "https://c9c992d5a347411db99537a0ed2c0094@o4505106964742144.ingest.sentry.io/4505106967691264",
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
  // start the db & run migrations
  await AppDataSource.runMigrations();

  // const entityManager = AppDataSource.createEntityManager();
  // for (const profile of profiles) {
  //   // get the discord user
  //   for (const streamerId of profile.streamer_id) {
  //     const streamer = await entityManager.findOneOrFail(Streamer, {
  //       where: {
  //         id: streamerId,
  //       },
  //     });

  //     const discUser = new DiscordUser(profile.user_id);
  //     await entityManager.save(discUser);

  //     const userSub = new DiscordUserSubscription(discUser, profile.channel_id, streamer);
  //     await entityManager.save(userSub);
  //   }
  // }
}
