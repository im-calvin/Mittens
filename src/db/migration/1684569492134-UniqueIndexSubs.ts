import { MigrationInterface, QueryRunner } from "typeorm";

export class UniqueIndexSubs1684569492134 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE UNIQUE INDEX IDX_2d3e9c3b3f3b0c4f3b3b3b3b3b ON discord_user_subscriptions(discord_user_id, discord_channel_id, streamer_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IDX_2d3e9c3b3f3b0c4f3b3b3b3b3b`);
  }
}
