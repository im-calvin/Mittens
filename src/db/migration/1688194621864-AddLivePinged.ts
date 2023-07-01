import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLivePinged1688194621864 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE videos ADD live_pinged boolean DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE videos DROP COLUMN live_pinged`);
  }
}
