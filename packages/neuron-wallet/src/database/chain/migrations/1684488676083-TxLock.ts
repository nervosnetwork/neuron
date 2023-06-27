import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class TxLock1684488676083 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`CREATE TABLE "tx_lock" ("lockHash" varchar NOT NULL, "transactionHash" varchar NOT NULL, PRIMARY KEY ("transactionHash", "lockHash"))`)
      await queryRunner.createIndex("tx_lock", new TableIndex({ columnNames: ['lockHash'] }))
      await queryRunner.createIndex("tx_lock", new TableIndex({ columnNames: ['transactionHash'] }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "tx_lock"`)
    }

}
