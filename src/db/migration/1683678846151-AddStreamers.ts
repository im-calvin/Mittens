import { MigrationInterface, QueryRunner } from "typeorm";
import 

export default class AddStreamers1683678846151 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    throw new Error("AddStreamers migration failed");
  }
}
