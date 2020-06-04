import {MigrationInterface, QueryRunner} from "typeorm";

export class AddSudtTokenInfo1587523557249 implements MigrationInterface {
    name = 'AddSudtTokenInfo1587523557249'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "sudt_token_info" ("walletID" varchar NOT NULL, "tokenID" varchar NOT NULL, "symbol" varchar NOT NULL, "tokenName" varchar NOT NULL, "decimal" varchar NOT NULL, PRIMARY KEY ("walletID", "tokenID"))`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_170cc8713de07c88c9cee72d6f" ON "sudt_token_info" ("walletID", "tokenID") `, undefined);

        await queryRunner.query(`DROP INDEX "IDX_45d13ed936502317a33630ee7d"`, undefined);
        await queryRunner.query(`CREATE TABLE "temporary_asset_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletID" varchar NOT NULL, "tokenID" varchar NOT NULL, "balance" varchar NOT NULL, "blake160" varchar NOT NULL, "accountName" varchar NOT NULL DEFAULT (''), CONSTRAINT "FK_b7196377d342f2ee5baddf6d03f" FOREIGN KEY ("walletID", "tokenID") REFERENCES "sudt_token_info" ("walletID", "tokenID") ON DELETE CASCADE ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_asset_account"("id", "walletID", "tokenID", "balance", "blake160", "accountName") SELECT "id", "walletID", "tokenID", "balance", "blake160", "accountName" FROM "asset_account"`, undefined);
        await queryRunner.query(`DROP TABLE "asset_account"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_asset_account" RENAME TO "asset_account"`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_45d13ed936502317a33630ee7d" ON "asset_account" ("walletID", "tokenID", "blake160") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_45d13ed936502317a33630ee7d"`, undefined);
        await queryRunner.query(`ALTER TABLE "asset_account" RENAME TO "temporary_asset_account"`, undefined);
        await queryRunner.query(`CREATE TABLE "asset_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletID" varchar NOT NULL, "tokenID" varchar NOT NULL, "symbol" varchar NOT NULL, "decimal" varchar NOT NULL, "balance" varchar NOT NULL, "blake160" varchar NOT NULL, "accountName" varchar NOT NULL DEFAULT (''), "tokenName" varchar NOT NULL DEFAULT (''))`, undefined);
        await queryRunner.query(`INSERT INTO "asset_account"("id", "walletID", "tokenID", "balance", "blake160", "accountName") SELECT "id", "walletID", "tokenID", "balance", "blake160", "accountName" FROM "temporary_asset_account"`, undefined);
        await queryRunner.query(`DROP TABLE "temporary_asset_account"`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_45d13ed936502317a33630ee7d" ON "asset_account" ("walletID", "tokenID", "blake160") `, undefined);

        await queryRunner.query(`DROP INDEX "IDX_170cc8713de07c88c9cee72d6f"`, undefined);
        await queryRunner.query(`DROP TABLE "sudt_token_info"`, undefined);
    }

}
