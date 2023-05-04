import "reflect-metadata";
import { DataSource } from "typeorm";
import { Video } from "./entity/Video.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import { Streamer } from "./entity/Streamer.js";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: true,
  logging: false,
  entities: [Video, DiscordUser, Streamer],
  migrations: [],
  subscribers: [],
});
