import {MigrationInterface, QueryRunner} from "typeorm";

export class CreateAssetAccount1586420715474 implements MigrationInterface {
    name = 'CreateAssetAccount1586420715474'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "asset_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletID" varchar NOT NULL, "tokenID" varchar NOT NULL, "symbol" varchar NOT NULL, "fullName" varchar NOT NULL, "decimal" varchar NOT NULL, "balance" varchar NOT NULL, "blake160" varchar NOT NULL)`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_45d13ed936502317a33630ee7d" ON "asset_account" ("walletID", "tokenID", "blake160") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_45d13ed936502317a33630ee7d"`, undefined);
        await queryRunner.query(`DROP TABLE "asset_account"`, undefined);
    }

}
