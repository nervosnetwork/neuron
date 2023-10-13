import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class TxLockAddArgs1694746034975 implements MigrationInterface {
    name = 'TxLockAddArgs1694746034975'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tx_lock" ADD COLUMN "lockArgs" varchar;`);
        await queryRunner.createIndex("tx_lock", new TableIndex({ columnNames: ["lockArgs"] }))
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tx_lock" DROP COLUMN "lockArgs" varchar;`);
    }

}
