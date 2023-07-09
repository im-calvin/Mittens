import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddTranslateStatuses1688860131193 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "guild_translate_statuses",
        columns: [
          {
            name: "discord_guild_id",
            type: "text",
            isPrimary: true,
          },
          {
            name: "status",
            type: "integer", // bool is integer (0, 1)
          },
        ],
      })
    );

    // insert uuuu server
    await queryRunner.query(
      `INSERT INTO guild_translate_statuses (discord_guild_id, status) VALUES ('1009337796357533766', 0)`
    );
    // insert emojizone
    await queryRunner.query(
      `INSERT INTO guild_translate_statuses (discord_guild_id, status) VALUES ('445609667431759872', 1)`
    );

    // insert squirty cream
    await queryRunner.query(
      `INSERT INTO guild_translate_statuses (discord_guild_id, status) VALUES ('886825927902892042', 0)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("guild_translate_statuses");
  }
}
