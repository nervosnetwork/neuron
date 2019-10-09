import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddLockToInput1570522869590 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('input', new TableColumn({
        name: 'lock',
        type: 'text',
        isNullable: true,
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn('input', 'lock')
    }

}
