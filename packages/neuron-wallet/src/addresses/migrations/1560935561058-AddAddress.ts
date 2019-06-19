import {MigrationInterface, QueryRunner} from "typeorm";

export class AddAddress1560935561058 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "address" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "address" varchar NOT NULL, "path" varchar NOT NULL, "addressType" integer NOT NULL, "addressIndex" integer NOT NULL, "txCount" integer NOT NULL)`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP TABLE "address"`);
    }

}
