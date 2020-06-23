import {MigrationInterface, QueryRunner} from "typeorm";

export class AddIndexerTxHashCache1592727615004 implements MigrationInterface {
    name = 'AddIndexerTxHashCache1592727615004'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "indexer_tx_hash_cache" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "txHash" character(32) NOT NULL, "lockHash" character(32) NOT NULL, "address" character(32) NOT NULL, "walletId" character(32) NOT NULL, "blockNumber" integer NOT NULL, "blockHash" character(32) NOT NULL, "blockTimestamp" varchar NOT NULL, "isProcessed" boolean NOT NULL, "createdAt" varchar NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" varchar NOT NULL DEFAULT (CURRENT_TIMESTAMP))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_787c6f1551a7197089b0dfc9fb" ON "indexer_tx_hash_cache" ("txHash") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_df137a7e8bc7d7a6ef7d0142f0" ON "indexer_tx_hash_cache" ("lockHash") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_fce503379a448194774cad27e1" ON "indexer_tx_hash_cache" ("address") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7c63a382eee02f609032da75b9" ON "indexer_tx_hash_cache" ("walletId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_b45745175aff3f6757f32da254" ON "indexer_tx_hash_cache" ("blockNumber") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_154a321c4f8a3146785f9a1d9f" ON "indexer_tx_hash_cache" ("blockHash") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_519c8c0bf5720806f68d6f8985" ON "indexer_tx_hash_cache" ("blockTimestamp") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_c43afc726fbecda4f0c715d917" ON "indexer_tx_hash_cache" ("isProcessed") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "indexer_tx_hash_cache"`, undefined);
    }

}
