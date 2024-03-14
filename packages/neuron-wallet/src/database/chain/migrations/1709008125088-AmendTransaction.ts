import {MigrationInterface, QueryRunner} from "typeorm";

export class AmendTransaction1709008125088 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE "amend_transaction" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "hash" varchar NOT NULL, "amendHash" varchar NOT NULL)`)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "amend_transaction"`)
    }

}
