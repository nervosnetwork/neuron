import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultiSignConfig1646817547204 implements MigrationInterface {
    name = 'AddMultiSignConfig1646817547204'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE "multi_sign_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "m" integer, "n" integer, "r" integer, "blake160s" varchar, "alias" varchar, "fullpayload" varchar)`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "multi_sign_config"`);
    }

}
