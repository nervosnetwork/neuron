import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddTypeAndHasData1567144517514 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('output', new TableColumn({
        name: 'typeScript',
        type: 'varchar',
        isNullable: true,
      }))

      await queryRunner.addColumn('output', new TableColumn({
        name: 'hasData',
        type: 'boolean',
        default: false,
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn('output', 'hasData')
      await queryRunner.dropColumn('output', 'typeScript')
    }

}
