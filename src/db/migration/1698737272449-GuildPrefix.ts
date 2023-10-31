import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class GuildPrefix1698737272449 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER guild_translate_statuses RENAME TO guild_info`);

    await queryRunner.addColumn(
      "guild_info",
      new TableColumn({
        name: "cmd_prefix",
        type: "text",
        default: "$",
        isPrimary: true,
      })
    );

    await queryRunner.changeColumn(
      "guild_info",
      "status",
      new TableColumn({
        name: "translate_status",
        type: "integer",
        isPrimary: true,
        default: "0",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
