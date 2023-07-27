import {MigrationInterface, QueryRunner} from "typeorm";
import SyncProgress from "../entities/sync-progress";

export class AddWalletPrimary1690361215400 implements MigrationInterface {
    name = 'AddWalletPrimary1690361215400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const syncProgresses = await queryRunner.manager.find(SyncProgress)
        await queryRunner.query(`DROP TABLE "sync_progress"`)
        await queryRunner.query(`CREATE TABLE "sync_progress" ("hash" varchar NOT NULL, "args" varchar NOT NULL, "codeHash" varchar NOT NULL, "hashType" varchar NOT NULL, "scriptType" varchar NOT NULL, "walletId" varchar NOT NULL, "blockStartNumber" integer NOT NULL, "blockEndNumber" integer, "cursor" varchar, "delete" boolean, "addressType" integer, PRIMARY KEY ("hash", "walletId"))`)
        for (let index = 0; index < syncProgresses.length; index += 500) {
          await queryRunner.manager.save(syncProgresses.slice(index, index + 500))
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "sync_progress"`)
    }

}
