import "reflect-metadata";
import { DataSource } from "typeorm";
import { Video } from "./entity/Video.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import { Streamer } from "./entity/Streamer.js";
import { Group } from "./entity/Group.js";
import { DiscordUserSubscription } from "./entity/DiscordUserSubscription.js";
import InitMigration from "./migration/init_1683419331403.js";
import AddStreamers from "./migration/1683678846151-AddStreamers.js";
import ClearNonUniqueSubs from "./migration/1684426659702-ClearNonUniqueSubs.js"
import { VideoParticipant } from "./entity/VideoParticipant.js";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "data/database.sqlite",
  synchronize: false,
  logging: ["error"],
  entities: [
    Video,
    DiscordUser,
    Streamer,
    Group,
    DiscordUserSubscription,
    VideoParticipant,
  ],
  migrations: [InitMigration, AddStreamers, ClearNonUniqueSubs],
  subscribers: [],
  migrationsTransactionMode: "all",
});
