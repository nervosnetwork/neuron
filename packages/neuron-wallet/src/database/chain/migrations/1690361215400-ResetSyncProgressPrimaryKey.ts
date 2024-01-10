import {MigrationInterface, QueryRunner} from "typeorm";

const chunk = 100
export class ResetSyncProgressPrimaryKey1690361215400 implements MigrationInterface {
    name = 'ResetSyncProgressPrimaryKey1690361215400'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const syncProgresses = await queryRunner.manager.query('select * from sync_progress')
        await queryRunner.query(`DROP TABLE "sync_progress"`)
        await queryRunner.query(`CREATE TABLE "sync_progress" ("hash" varchar NOT NULL, "args" varchar NOT NULL, "codeHash" varchar NOT NULL, "hashType" varchar NOT NULL, "scriptType" varchar NOT NULL, "walletId" varchar NOT NULL, "blockStartNumber" integer NOT NULL, "blockEndNumber" integer, "cursor" varchar, "delete" boolean, "addressType" integer, PRIMARY KEY ("hash", "walletId"))`)
        for (let index = 0; index < syncProgresses.length; index += chunk) {
          await queryRunner.manager.query(`INSERT INTO sync_progress VALUES ${syncProgresses.slice(index, index + chunk).reduce((pre: string, cur: any) => `${pre ? `${pre},` : ''}("${cur.hash}","${cur.args}","${cur.codeHash}","${cur.hashType}","${cur.scriptType}","${cur.walletId}",${cur.blockStartNumber},${cur.blockEndNumber},${cur.cursor ? `"${cur.cursor}"` : 'NULL'},${cur.delete},${cur.addressType})`, '')};`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "sync_progress"`)
    }

}
