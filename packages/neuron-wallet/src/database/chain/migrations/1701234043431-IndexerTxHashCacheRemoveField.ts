import {MigrationInterface, QueryRunner} from "typeorm";

export class IndexerTxHashCacheRemoveField1701234043431 implements MigrationInterface {
    name = 'IndexerTxHashCacheRemoveField1701234043431'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('indexer_tx_hash_cache', 'blockHash');
        await queryRunner.dropColumn('indexer_tx_hash_cache', 'blockTimestamp');
    }

    public async down(): Promise<void> {}

}
