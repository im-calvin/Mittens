import {
  Column,
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from "typeorm";
import { Group } from "../entity/Group.js";

export class StreamersLanguages1685251838704 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "languages",
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

    await queryRunner.addColumn(
      "streamers",
      new TableColumn({
        name: "language_id",
        type: "integer",
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      "streamers",
      new TableForeignKey({
        columnNames: ["language_id"],
        referencedTableName: "languages",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    const groups: Group[] = await queryRunner.query(`SELECT id, name FROM groups`);
    const streamers = await queryRunner.query(`SELECT * FROM streamers`);
    // languages = ["English Male", "English Female", "Japanese Male", "Japanese Female", "Indonesia Male", "Indonesia Female"]
    const holostarsEn = groups.filter((group) =>
      group.name.toLowerCase().includes("holostars english")
    );

    const holostarsJp = groups.filter(
      (group) => group.name.toLowerCase().includes("holostars") && !holostarsEn.includes(group)
    );

    const hololiveEn = groups.filter(
      (group) => group.name.toLowerCase().includes("english") && !holostarsEn.includes(group)
    );

    const hololiveId = groups.filter((group) => group.name.toLowerCase().includes("indonesia"));

    const hololiveJp = groups.filter(
      (group) =>
        !hololiveEn.includes(group) &&
        !holostarsEn.includes(group) &&
        !holostarsJp.includes(group) &&
        !hololiveId.includes(group)
    );

    const languageGroups = {
      "Holostars English": holostarsEn,
      "Holostars Japan": holostarsJp,
      "Hololive English": hololiveEn,
      "Hololive Japan": hololiveJp,
      "Hololive Indonesia": hololiveId,
    };

    for (const language of Object.keys(languageGroups)) {
      await queryRunner.query(`INSERT INTO languages (name) VALUES (?)`, [language]);
    }

    for (const streamer of streamers) {
      for (const [language, groups] of Object.entries(languageGroups)) {
        if (groups.map((group) => group.id).includes(streamer.group_id)) {
          // specify the correct group
          const [languageId] = await queryRunner.query(`SELECT id FROM languages WHERE name = ?`, [
            language,
          ]); // since name is unique languageId will be an array with one element
          await queryRunner.query(`UPDATE streamers SET language_id = ? WHERE id = ?`, [
            languageId.id,
            streamer.id,
          ]);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("languages");
    await queryRunner.dropColumn("streamers", "language_id");
  }
}
