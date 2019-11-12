import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class RemoveTotalBalance1573458655136 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('address', 'totalBalance')
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn('address', new TableColumn({
      name: 'totalBalance',
      type: 'varchar',
      default: '0',
    }))
  }

}
