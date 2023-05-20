import "reflect-metadata";
import { DataSource } from "typeorm";
import { Video } from "./entity/Video.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import { Streamer } from "./entity/Streamer.js";
import { Group } from "./entity/Group.js";
import { DiscordUserSubscription } from "./entity/DiscordUserSubscription.js";
import InitMigration from "./migration/init_1683419331403.js";
import { AddStreamers1683678846151 } from "./migration/1683678846151-AddStreamers.js";
import { VideoParticipant } from "./entity/VideoParticipant.js";
import { UniqueIndexSubs1684569492134 } from "./migration/1684569492134-UniqueIndexSubs.js";
import { ClearNonUniqueSubs1684426659702 } from "./migration/1684426659702-ClearNonUniqueSubs.js";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "data/database.sqlite",
  synchronize: false,
  logging: ["error"],
  entities: [Video, DiscordUser, Streamer, Group, DiscordUserSubscription, VideoParticipant],
  migrations: [
    InitMigration,
    AddStreamers1683678846151,
    ClearNonUniqueSubs1684426659702,
    UniqueIndexSubs1684569492134,
  ],
  subscribers: [],
  migrationsTransactionMode: "all",
});
