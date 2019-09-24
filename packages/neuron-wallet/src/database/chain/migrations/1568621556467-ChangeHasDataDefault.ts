import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class ChangeHasDataDefault1568621556467 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.changeColumn('output', 'hasData', new TableColumn({
        name: 'hasData',
        type: 'boolean',
        default: 0,
      }))
    }

    public async down(_queryRunner: QueryRunner): Promise<any> {
    }

}
