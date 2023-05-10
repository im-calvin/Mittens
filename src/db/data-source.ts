import "reflect-metadata";
import { DataSource } from "typeorm";
import { Video } from "./entity/Video.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import { Streamer } from "./entity/Streamer.js";
import { Group } from "./entity/Group.js";
import { DiscordUserSubscription } from "./entity/DiscordUserSubscription.js";
import InitMigration from "./migration/init_1683419331403.js";
import AddStreamers from "./migration/1683678846151-AddStreamers.js";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: false,
  logging: false,
  entities: [Video, DiscordUser, Streamer, Group, DiscordUserSubscription],
  migrations: [InitMigration, AddStreamers],
  subscribers: [],
  migrationsTransactionMode: "all",
});
