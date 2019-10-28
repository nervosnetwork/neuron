import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class AddIndexToTxTimestamp1572137226866 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createIndex("transaction", new TableIndex({ columnNames: ["timestamp"] }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropIndex("transaction", new TableIndex({ columnNames: ["timestamp"] }))
    }

}
