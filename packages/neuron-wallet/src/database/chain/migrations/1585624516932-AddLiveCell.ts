import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class AddLiveCell1585624516932 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE IF NOT EXISTS "live_cell" ("txHash" character(32) NOT NULL, "outputIndex" integer NOT NULL, "createdBlockNumber" bigint NOT NULL, "usedBlockNumber" bigint, "capacity" varchar NOT NULL, "lockHash" character(32) NOT NULL, "lockHashType" character(1) NOT NULL, "lockCodeHash" character(32) NOT NULL, "lockArgs" varchar NOT NULL, "typeHash" character(32), "typeHashType" character(1), "typeCodeHash" character(32), "typeArgs" varchar, "data" varchar(64) NOT NULL, PRIMARY KEY ("txHash", "outputIndex"))`);
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["lockHash"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["lockHashType"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["lockCodeHash"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["typeHash"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["typeHashType"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["typeCodeHash"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["createdBlockNumber"] }))
      await queryRunner.createIndex("live_cell", new TableIndex({ columnNames: ["usedBlockNumber"] }))
    }

    public async down(_queryRunner: QueryRunner): Promise<any> {
    }

}
