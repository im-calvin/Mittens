import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from "typeorm";
import { Group } from "../entity/Group.js";
import { Language } from "../entity/Language.js";

export class NormalizeLanguages1690528636089 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // normalize the languages table by removing it from the streamers table and then adding it as a foreign key to groups
    await queryRunner.dropColumn("streamers", "language_id");

    await queryRunner.addColumn(
      "groups",
      new TableColumn({
        name: "language_id",
        type: "integer",
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      "groups",
      new TableForeignKey({
        columnNames: ["language_id"],
        referencedTableName: "languages",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      })
    );

    const groups: Group[] = await queryRunner.query(`SELECT id, name FROM groups`);
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

    interface LanguageId {
      id: Number;
    }

    for (const [languageName, namedGroups] of Object.entries(languageGroups)) {
      for (const group of namedGroups) {
        const [language]: LanguageId[] = await queryRunner.query(
          `SELECT id FROM languages WHERE name = ?`,
          [languageName]
        );
        await queryRunner.query(`UPDATE groups SET language_id = ? WHERE id = ?`, [
          language.id,
          group.id,
        ]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
