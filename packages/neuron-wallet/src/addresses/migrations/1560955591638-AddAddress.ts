import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAddress1560955591638 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "address" ("address" varchar PRIMARY KEY NOT NULL, "walletId" varchar NOT NULL, "path" varchar NOT NULL, "addressType" integer NOT NULL, "addressIndex" integer NOT NULL, "txCount" integer NOT NULL, "blake160" varchar NOT NULL, "version" varchar NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "address"`);
    }

}
