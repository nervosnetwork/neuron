import {MigrationInterface, QueryRunner} from "typeorm";

export class HDPublicKeyInfo1597799969212 implements MigrationInterface {
    name = 'HDPublicKeyInfo1597799969212'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "hd_public_key_info" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "walletId" varchar NOT NULL, "path" varchar NOT NULL, "address" varchar NOT NULL, "addressType" integer NOT NULL, "addressIndex" integer NOT NULL, "publicKeyInBlake160" varchar NOT NULL, "description" varchar, "createdAt" varchar NOT NULL DEFAULT (CURRENT_TIMESTAMP))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e09acac4e6b5d04436825ba83b" ON "hd_public_key_info" ("walletId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_4410222d46f6abb359f3060707" ON "hd_public_key_info" ("address") `, undefined);
        // const infos = await queryRunner.query(`SELECT * from hd_public_key_info`)
        // console.log(infos)
        // try {
        // } catch (error) {
        //   console.error(error)
        // }
        // await queryRunner.startTransaction()
        // try {
        //   await queryRunner.manager.save(tx)
        //   await queryRunner.commitTransaction();
        // } catch (err) {
        //   console.error('Database:\tmigration failed for public key info table:', err)
        //   await queryRunner.rollbackTransaction()
        //   throw err
        // } finally {
        //   await queryRunner.release()
        // }
    }

    public async down(): Promise<any> {
    }

}
