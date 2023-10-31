import { MigrationInterface, QueryRunner, Table } from "typeorm";
import { client } from "../../bot.js";

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

    // insert curr servers
    const guildsInsertStmt = `INSERT INTO guild_translate_statuses (discord_guild_id, status) VALUES (?, ?)`;
    const guilds = await client.guilds.fetch();
    guilds.forEach(async (server) => {
      await queryRunner.query(guildsInsertStmt, [server.id, false]);
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("guild_translate_statuses");
  }
}
