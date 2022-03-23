import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMultisigConfig1646817547204 implements MigrationInterface {
    name = 'AddMultisigConfig1646817547204'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE "multisig_config" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "m" integer, "n" integer, "r" integer, "addresses" varchar, "alias" varchar, "fullpayload" varchar)`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "multisig_config"`);
    }

}
