import { MigrationInterface, QueryRunner, TableUnique } from "typeorm";
import { getHoloChannels } from "../../utils/Holodex.js";
import { QueryFailedError } from "typeorm";

export class AddHoloEnAdvent1690521022694 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // code copied from AddStreamers migration
    const channels = await getHoloChannels();

    // array of unique group names
    const groupNames = channels
      .map((c) => c.group)
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      });
    // ignore unique key constraints
    const groupInsertStmt = `INSERT OR IGNORE INTO groups (name) VALUES (?)`;
    for (const group of groupNames) {
      await queryRunner.query(groupInsertStmt, [group]);
    }

    const groups = await queryRunner.query(`SELECT id, name FROM groups`);
    const channelInsertStmt = `INSERT OR IGNORE INTO streamers (id, name, group_id) VALUES (?, ?, ?)`;
    // ignore unique key constraints
    for (const channel of channels) {
      const groupId = groups.find((g: any) => g.name === channel.group).id;
      await queryRunner.query(channelInsertStmt, [channel.id, channel.name, groupId]);
    }

    // need to add languageId = Hololive English to all streamers
    await queryRunner.query(
      `UPDATE streamers 
      SET language_id = 3 
      WHERE name in ('Nerissa Ravencroft Ch. hololive-EN', 'FUWAMOCO Ch. hololive-EN', 'Shiori Novella Ch. hololive-EN', 'Koseki Bijou Ch. hololive-EN')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // do nothing
  }
}
