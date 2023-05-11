import { DataSource, MigrationInterface, QueryRunner } from "typeorm";
import { getHoloChannels } from "../../utils/Holodex.js";
import { Streamer } from "../entity/Streamer.js";
import { Group } from "../entity/Group.js";
import { AppDataSource } from "../data-source.js";

export default class AddStreamers1683678846151 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // connection already created
    const streamerRepo = AppDataSource.getRepository(Streamer);
    const groupRepo = AppDataSource.getRepository(Group);

    const channels = await getHoloChannels();
    for (let channel of channels) {
      if (channel.group === null) {
        throw new Error("Channel found without a group");
      }

      let maybeGroup = await groupRepo.findOneBy({
        name: channel.group,
        // relations: {
        //   streamers: true,
        // },
      });
      // if group doesn't exist then make one
      if (maybeGroup === null) {
        maybeGroup = new Group(channel.group);
        await groupRepo.save(maybeGroup);
        // get a new group because this one will have an autogenerated id
        maybeGroup = await groupRepo.findOneByOrFail({
          name: channel.group,
        });
      }

      const streamer = new Streamer(channel.id, channel.name, maybeGroup);
      streamerRepo.save(streamer);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error("AddStreamers migration failed");
  }
}