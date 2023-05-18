import { MigrationInterface, QueryRunner } from "typeorm";

export default class ClearNonUniqueSubs1684426659702 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // delete all non-unique rows in the discord_user_subscriptions table
    await queryRunner.query(`
            DELETE FROM discord_user_subscriptions
            WHERE id NOT IN (
                SELECT MIN(id)
                FROM discord_user_subscriptions
                GROUP BY discord_user_id, discord_channel_id, streamer_id
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // do nothing
  }
}
