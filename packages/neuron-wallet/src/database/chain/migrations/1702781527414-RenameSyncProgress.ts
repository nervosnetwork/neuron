import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class RenameSyncProgress1702781527414 implements MigrationInterface {
    name = 'RenameSyncProgress1702781527414'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('sync_progress', 'blockStartNumber', 'localSavedBlockNumber')
        await queryRunner.renameColumn('sync_progress', 'blockEndNumber', 'syncedBlockNumber')
        await queryRunner.addColumn('sync_progress', new TableColumn({
          name: 'lightStartBlockNumber',
          type: 'integer',
          default: 0
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('sync_progress', 'localSavedBlockNumber', 'blockStartNumber')
        await queryRunner.renameColumn('sync_progress', 'syncedBlockNumber', 'blockEndNumber')
    }

}
