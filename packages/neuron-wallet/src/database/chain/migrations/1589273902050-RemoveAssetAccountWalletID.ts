import {MigrationInterface, QueryRunner} from "typeorm";

export class RemoveAssetAccountWalletID1589273902050 implements MigrationInterface {
    name = 'RemoveAssetAccountWalletID1589273902050'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_45d13ed936502317a33630ee7d"`, undefined);

        await queryRunner.query(`CREATE TABLE "temporary_sudt_token_info" ("tokenID" varchar PRIMARY KEY NOT NULL, "symbol" varchar NOT NULL, "tokenName" varchar NOT NULL, "decimal" varchar NOT NULL)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_sudt_token_info" ("tokenID", "symbol", "tokenName", "decimal") SELECT "tokenID", "symbol", "tokenName", "decimal" FROM "sudt_token_info" GROUP BY "tokenID"`, undefined);
        await queryRunner.query(`ALTER TABLE "sudt_token_info" RENAME TO "tmp_sudt_token_info"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_sudt_token_info" RENAME TO "sudt_token_info"`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fc9be29a7b41774a335b792513" ON "sudt_token_info" ("tokenID") `, undefined);

        await queryRunner.query(`CREATE TABLE "temporary_asset_account" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tokenID" varchar NOT NULL, "balance" varchar NOT NULL, "blake160" varchar NOT NULL, "accountName" varchar NOT NULL DEFAULT (''), CONSTRAINT "FK_1f91b5d9e9e54ebbeb5b53aaa4c" FOREIGN KEY ("tokenID") REFERENCES "sudt_token_info" ("tokenID") ON DELETE CASCADE ON UPDATE NO ACTION)`, undefined);
        await queryRunner.query(`INSERT INTO "temporary_asset_account"("id", "tokenID", "balance", "blake160", "accountName") SELECT "id", "tokenID", "balance", "blake160", "accountName" FROM "asset_account" GROUP BY "tokenID", "blake160"`, undefined);
        await queryRunner.query(`DROP TABLE "asset_account"`, undefined);
        await queryRunner.query(`ALTER TABLE "temporary_asset_account" RENAME TO "asset_account"`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cddf74344ca1af4d0f0ebf3da9" ON "asset_account" ("tokenID", "blake160") `, undefined);

        await queryRunner.query(`DROP TABLE "tmp_sudt_token_info"`, undefined);
    }

    public async down(_queryRunner: QueryRunner): Promise<any> {
      // can't down
    }

}
