import { EntityMetadata, MigrationInterface, QueryRunner, TableColumn } from "typeorm";
import profiles from "../../../profiles.json" assert { type: "json" };
import { AppDataSource } from "../data-source.js";
import { DiscordUser } from "../entity/DiscordUser.js";
import { DiscordUserSubscription } from "../entity/DiscordUserSubscription.js";
import { Streamer } from "../entity/Streamer.js";

export default class AddUsers1683799674398 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await AppDataSource.transaction(async (entityManager) => {
      for (const profile of profiles) {
        // get the discord user
        for (const streamerId of profile.streamer_id) {
          const streamer = await entityManager.findOneOrFail(Streamer, {
            where: {
              id: streamerId,
            },
          });

          const discUser = new DiscordUser(profile.user_id);
          await entityManager.save(discUser);

          const userSub = new DiscordUserSubscription(
            discUser,
            profile.channel_id,
            streamer
          );
          await entityManager.save(userSub);
        }
      }
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error("Unable to add users to database");
  }
}
