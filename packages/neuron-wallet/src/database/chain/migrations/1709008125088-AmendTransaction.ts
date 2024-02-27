import {MigrationInterface, QueryRunner} from "typeorm";

export class AmendTransaction1709008125088 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`CREATE TABLE "amend_transaction" ("hash" varchar NOT NULL, "amendHash" varchar NOT NULL, PRIMARY KEY ("hash"))`)
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`DROP TABLE "amend_transaction"`)
    }

}
