import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export default class Init_1683419331403 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "videos",
        columns: [
          {
            name: "id",
            type: "text",
            isPrimary: true,
          },
          {
            name: "scheduled_time",
            type: "timestamp",
          },
          {
            name: "title",
            type: "text",
          },
          {
            name: "host_streamer_id",
            type: "integer",
          },
        ],
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "video_participants",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "video_id",
            type: "text",
          },
          {
            name: "participant_streamer_id",
            type: "integer",
          },
        ],
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "streamers",
        columns: [
          {
            name: "id",
            type: "text",
            isPrimary: true,
          },
          {
            name: "name",
            type: "text",
          },
          {
            name: "group_id",
            type: "integer",
          },
        ],
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "groups",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "name",
            type: "text",
            isUnique: true,
          },
        ],
      })
    );

    await queryRunner.createForeignKey(
      "streamers",
      new TableForeignKey({
        columnNames: ["group_id"],
        referencedTableName: "groups",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
    await queryRunner.createForeignKey(
      "videos",
      new TableForeignKey({
        columnNames: ["host_streamer_id"],
        referencedTableName: "streamers",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );
    await queryRunner.createForeignKeys("video_participants", [
      new TableForeignKey({
        columnNames: ["video_id"],
        referencedTableName: "videos",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
      new TableForeignKey({
        columnNames: ["participant_streamer_id"],
        referencedTableName: "streamers",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    ]);

    await queryRunner.createTable(
      new Table({
        name: "discord_users",
        columns: [
          {
            name: "id",
            type: "text",
            isPrimary: true,
          },
        ],
      })
    );

    await queryRunner.createTable(
      new Table({
        name: "discord_user_subscriptions",
        columns: [
          {
            name: "id",
            type: "integer",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment",
          },
          {
            name: "discord_user_id",
            type: "text",
          },
          {
            name: "discord_channel_id",
            type: "text",
          },
          {
            name: "streamer_id",
            type: "integer",
          },
        ],
      })
    );

    await queryRunner.createForeignKeys("discord_user_subscriptions", [
      new TableForeignKey({
        columnNames: ["discord_user_id"],
        referencedTableName: "discord_users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
      new TableForeignKey({
        columnNames: ["streamer_id"],
        referencedTableName: "streamers",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    ]);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error("エラーです！実行されるはいけません。");
  }
}
