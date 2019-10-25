import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class AddIndices1572006450765 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createIndex("input", new TableIndex({ columnNames: ["transactionHash", "lockHash"] }))
        await queryRunner.createIndex("output", new TableIndex({ columnNames: ["transactionHash", "lockHash"] }))
        await queryRunner.createIndex("transaction", new TableIndex({ columnNames: ["status"] }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropIndex("input", new TableIndex({ columnNames: ["transactionHash", "lockHash"] }))
        await queryRunner.dropIndex("output", new TableIndex({ columnNames: ["transactionHash", "lockHash"] }))
        await queryRunner.dropIndex("transaction", new TableIndex({ columnNames: ["status"] }))
    }

}
