import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSyncProgress1676441837373 implements MigrationInterface {
  name = 'AddSyncProgress1676441837373'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sync_progress"
      (
        "hash" varchar PRIMARY KEY NOT NULL,
        "args" varchar NOT NULL,
        "codeHash" varchar NOT NULL,
        "hashType" varchar NOT NULL,
        "scriptType" varchar NOT NULL,
        "walletId" varchar NOT NULL,
        "blockStartNumber" integer NOT NULL,
        "blockEndNumber" integer,
        "cursor" varchar,
        "softDelete" boolean
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sync_progress"`);
  }

}
