import { DataSource, MigrationInterface, QueryRunner } from "typeorm";
import { getHoloChannels } from "../../utils/Holodex.js";
import { AppDataSource } from "../data-source.js";

export default class AddStreamers1683678846151 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // connection already created
    const channels = await getHoloChannels();
    AppDataSource.createEntityManager(queryRunner);

    // array of unique group names
    const groupNames = channels
      .map((c) => c.group)
      .filter((value, index, array) => {
        return array.indexOf(value) === index;
      });
    const groupInsertStmt = `INSERT INTO groups (name) VALUES (?)`;
    for (const group of groupNames) {
      await queryRunner.query(groupInsertStmt, [group]);
    }

    /* [{
        id: 1,
        name: "HOLOSTARS English..."
      }, ...] */
    const groups = await queryRunner.query(`SELECT id, name FROM groups`);
    const channelInsertStmt = `INSERT INTO streamers (id, name, group_id) VALUES (?, ?, ?)`;
    for (const channel of channels) {
      const groupId = groups.find((g: any) => g.name === channel.group).id;
      await queryRunner.query(channelInsertStmt, [channel.id, channel.name, groupId]);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error("AddStreamers migration failed");
  }
}
