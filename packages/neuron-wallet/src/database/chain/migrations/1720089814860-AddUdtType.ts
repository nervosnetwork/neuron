import {MigrationInterface, QueryRunner} from "typeorm";

export class AddUdtType1720089814860 implements MigrationInterface {
    name = 'AddUdtType1720089814860'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sudt_token_info" ADD COLUMN "udtType" varchar;`)
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_37bb4f2a4a849bf0b1dadee2c7" ON "sudt_token_info" ("tokenID", "udtType") `);
        await queryRunner.query(`UPDATE "sudt_token_info" set udtType="sUDT" where tokenID!="CKBytes"`)
        await queryRunner.query(`ALTER TABLE "asset_account" ADD COLUMN "udtType" varchar;`)
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5139df6b311e63ecdd93cd17ed" ON "asset_account" ("tokenID", "blake160", "udtType") `);
        await queryRunner.query(`UPDATE "asset_account" set udtType="sUDT" where tokenID!="CKBytes"`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_37bb4f2a4a849bf0b1dadee2c7"`);
        await queryRunner.query(`ALTER TABLE "sudt_token_info" DROP COLUMN "udtType";`);
        await queryRunner.query(`DROP INDEX "IDX_5139df6b311e63ecdd93cd17ed"`);
        await queryRunner.query(`ALTER TABLE "asset_account" DROP COLUMN "udtType";`);
    }

}
