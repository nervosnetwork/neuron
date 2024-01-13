import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class RemoveAddressInIndexerCache1704357651876 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.dropColumn('indexer_tx_hash_cache', 'address')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.addColumn('indexer_tx_hash_cache', new TableColumn({
        name: 'address',
        type: 'character(32)',
        isNullable: false,
      }))
    }

}
