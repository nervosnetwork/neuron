import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class HDPublicKeyInfo1598087517643 implements MigrationInterface {
    name = 'HDPublicKeyInfo1598087517643'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "hd_public_key_info" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "path" varchar NOT NULL, "address" varchar NOT NULL, "addressType" integer NOT NULL, "addressIndex" integer NOT NULL, "publicKeyInBlake160" varchar NOT NULL, "description" varchar, "createdAt" varchar NOT NULL DEFAULT (CURRENT_TIMESTAMP))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e09acac4e6b5d04436825ba83b" ON "hd_public_key_info" ("walletId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_4410222d46f6abb359f3060707" ON "hd_public_key_info" ("address") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6cea1798a91670de43512bc953" ON "hd_public_key_info" ("addressIndex") `, undefined);

        await queryRunner.createIndex("output", new TableIndex({ columnNames: ["lockArgs"] }))
        await queryRunner.createIndex("input", new TableIndex({ columnNames: ["lockArgs"] }))
    }

    public async down(): Promise<any> {}

}
