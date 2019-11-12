import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddInputIndexToInput1573461100330 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn('input', new TableColumn({
      name: 'inputIndex',
      type: 'varchar',
      isNullable: true,
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('input', 'inputIndex')
  }

}
