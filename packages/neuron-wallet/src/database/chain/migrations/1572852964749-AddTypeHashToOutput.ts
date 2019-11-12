import {MigrationInterface, QueryRunner, TableColumn} from "typeorm"

export class AddTypeHashToOutput1572852964749 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn('output', new TableColumn({
      name: 'typeHash',
      type: 'varchar',
      isNullable: true,
    }))

    await queryRunner.addColumn('output', new TableColumn({
      name: 'daoData',
      type: 'varchar',
      isNullable: true,
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('output', 'typeHash')
    await queryRunner.dropColumn('output', 'daoData')
  }

}
