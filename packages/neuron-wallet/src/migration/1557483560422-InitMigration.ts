import {MigrationInterface, QueryRunner} from "typeorm";

export class InitMigration1557483560422 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "output" ("outPointTxHash" varchar NOT NULL, "outPointIndex" integer NOT NULL, "capacity" varchar NOT NULL, "lock" text NOT NULL, "lockHash" varchar NOT NULL, "status" varchar NOT NULL, "transactionHash" varchar, PRIMARY KEY ("outPointTxHash", "outPointIndex"))`);
        await queryRunner.query(`CREATE TABLE "transaction" ("hash" varchar PRIMARY KEY NOT NULL, "version" integer NOT NULL, "deps" text NOT NULL, "witnesses" text NOT NULL, "timestamp" varchar NOT NULL, "blockNumber" varchar NOT NULL, "blockHash" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "input" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "outPointTxHash" varchar NOT NULL, "outPointIndex" varchar NOT NULL, "args" text NOT NULL, "lockHash" varchar, "capacity" varchar, "transactionHash" varchar)`);
        await queryRunner.query(`CREATE TABLE "sync_info" ("name" varchar PRIMARY KEY NOT NULL, "value" varchar NOT NULL)`);
        await queryRunner.query(`CREATE TABLE "temporary_output" ("outPointTxHash" varchar NOT NULL, "outPointIndex" integer NOT NULL, "capacity" varchar NOT NULL, "lock" text NOT NULL, "lockHash" varchar NOT NULL, "status" varchar NOT NULL, "transactionHash" varchar, CONSTRAINT "FK_29236a0eb11fac458990882f985" FOREIGN KEY ("transactionHash") REFERENCES "transaction" ("hash") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("outPointTxHash", "outPointIndex"))`);
        await queryRunner.query(`INSERT INTO "temporary_output"("outPointTxHash", "outPointIndex", "capacity", "lock", "lockHash", "status", "transactionHash") SELECT "outPointTxHash", "outPointIndex", "capacity", "lock", "lockHash", "status", "transactionHash" FROM "output"`);
        await queryRunner.query(`DROP TABLE "output"`);
        await queryRunner.query(`ALTER TABLE "temporary_output" RENAME TO "output"`);
        await queryRunner.query(`CREATE TABLE "temporary_input" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "outPointTxHash" varchar NOT NULL, "outPointIndex" varchar NOT NULL, "args" text NOT NULL, "lockHash" varchar, "capacity" varchar, "transactionHash" varchar, CONSTRAINT "FK_90ed760ab4ba57db62b3e798794" FOREIGN KEY ("transactionHash") REFERENCES "transaction" ("hash") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_input"("id", "outPointTxHash", "outPointIndex", "args", "lockHash", "capacity", "transactionHash") SELECT "id", "outPointTxHash", "outPointIndex", "args", "lockHash", "capacity", "transactionHash" FROM "input"`);
        await queryRunner.query(`DROP TABLE "input"`);
        await queryRunner.query(`ALTER TABLE "temporary_input" RENAME TO "input"`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "input" RENAME TO "temporary_input"`);
        await queryRunner.query(`CREATE TABLE "input" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "outPointTxHash" varchar NOT NULL, "outPointIndex" varchar NOT NULL, "args" text NOT NULL, "lockHash" varchar, "capacity" varchar, "transactionHash" varchar)`);
        await queryRunner.query(`INSERT INTO "input"("id", "outPointTxHash", "outPointIndex", "args", "lockHash", "capacity", "transactionHash") SELECT "id", "outPointTxHash", "outPointIndex", "args", "lockHash", "capacity", "transactionHash" FROM "temporary_input"`);
        await queryRunner.query(`DROP TABLE "temporary_input"`);
        await queryRunner.query(`ALTER TABLE "output" RENAME TO "temporary_output"`);
        await queryRunner.query(`CREATE TABLE "output" ("outPointTxHash" varchar NOT NULL, "outPointIndex" integer NOT NULL, "capacity" varchar NOT NULL, "lock" text NOT NULL, "lockHash" varchar NOT NULL, "status" varchar NOT NULL, "transactionHash" varchar, PRIMARY KEY ("outPointTxHash", "outPointIndex"))`);
        await queryRunner.query(`INSERT INTO "output"("outPointTxHash", "outPointIndex", "capacity", "lock", "lockHash", "status", "transactionHash") SELECT "outPointTxHash", "outPointIndex", "capacity", "lock", "lockHash", "status", "transactionHash" FROM "temporary_output"`);
        await queryRunner.query(`DROP TABLE "temporary_output"`);
        await queryRunner.query(`DROP TABLE "sync_info"`);
        await queryRunner.query(`DROP TABLE "input"`);
        await queryRunner.query(`DROP TABLE "transaction"`);
        await queryRunner.query(`DROP TABLE "output"`);
    }

}
