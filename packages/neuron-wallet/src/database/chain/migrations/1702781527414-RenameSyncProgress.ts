import {MigrationInterface, QueryRunner} from "typeorm";

export class RenameSyncProgress1702781527414 implements MigrationInterface {
    name = 'RenameSyncProgress1702781527414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // the typeorm renameColumn will throw an exception about drop indexer when rename or add column
        await queryRunner.query('ALTER TABLE "sync_progress" RENAME "blockStartNumber" to "localSavedBlockNumber"') 
        await queryRunner.query('ALTER TABLE "sync_progress" RENAME "blockEndNumber" to "syncedBlockNumber"')
        await queryRunner.query(`ALTER TABLE "sync_progress" ADD COLUMN "lightStartBlockNumber" integer DEFAULT 0;`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "sync_progress" RENAME "localSavedBlockNumber" to "blockStartNumber"') 
        await queryRunner.query('ALTER TABLE "sync_progress" RENAME "syncedBlockNumber" to "blockEndNumber"') 
      }

}
