import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddDepositOutPointToOutput1573305225465 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn('output', new TableColumn({
      name: 'depositTxHash',
      type: 'varchar',
      isNullable: true,
    }))

    await queryRunner.addColumn('output', new TableColumn({
      name: 'depositIndex',
      type: 'varchar',
      isNullable: true,
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('output', 'depositTxHash')
    await queryRunner.dropColumn('output', 'depositIndex')
  }

}
