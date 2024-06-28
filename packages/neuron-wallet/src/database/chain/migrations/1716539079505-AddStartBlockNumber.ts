import {MigrationInterface, QueryRunner} from "typeorm";

export class AddStartBlockNumber1716539079505 implements MigrationInterface {
    name = 'AddStartBlockNumber1716539079505'

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "multisig_config" ADD COLUMN "startBlockNumber" integer;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`ALTER TABLE "multisig_config" DROP COLUMN "startBlockNumber";`)
    }

}
