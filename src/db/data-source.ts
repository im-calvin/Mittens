import "reflect-metadata";
import { DataSource } from "typeorm";
import { Video } from "./entity/Video.js";
import { DiscordUser } from "./entity/DiscordUser.js";
import { Streamer } from "./entity/Streamer.js";
import { Group } from "./entity/Group.js";
import { DiscordUserSubscription } from "./entity/DiscordUserSubscription.js";
import { Language } from "./entity/Language.js";
import InitMigration from "./migration/init_1683419331403.js";
import { AddStreamers1683678846151 } from "./migration/1683678846151-AddStreamers.js";
import { VideoParticipant } from "./entity/VideoParticipant.js";
import { UniqueIndexSubs1684569492134 } from "./migration/1684569492134-UniqueIndexSubs.js";
import { ClearNonUniqueSubs1684426659702 } from "./migration/1684426659702-ClearNonUniqueSubs.js";
import { StreamersLanguages1685251838704 } from "./migration/1685251838704-StreamersLanguages.js";
import { AddLivePinged1688194621864 } from "./migration/1688194621864-AddLivePinged.js";
import { AddTranslateStatuses1688860131193 } from "./migration/1688860131193-AddTranslateStatuses.js";
import { GuildTranslate } from "./entity/GuildTranslate.js";

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
    Language,
    GuildTranslate,
  ],
  migrations: [
    InitMigration,
    AddStreamers1683678846151,
    ClearNonUniqueSubs1684426659702,
    UniqueIndexSubs1684569492134,
    StreamersLanguages1685251838704,
    AddLivePinged1688194621864,
    AddTranslateStatuses1688860131193,
  ],
  subscribers: [],
  migrationsTransactionMode: "all",
});
