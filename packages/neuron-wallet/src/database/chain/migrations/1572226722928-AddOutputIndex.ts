import {MigrationInterface, QueryRunner, TableIndex} from "typeorm";

export class AddOutputIndex1572226722928 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.createIndex("output", new TableIndex({ columnNames: ["lockHash", "status", "hasData", "typeScript"] }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropIndex("output", new TableIndex({ columnNames: ["lockHash", "status", "hasData", "typeScript"] }))
    }

}
