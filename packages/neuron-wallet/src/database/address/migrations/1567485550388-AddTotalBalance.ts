import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddTotalBalance1567485550388 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn('address', new TableColumn({
      name: 'totalBalance',
      type: 'varchar',
      default: '0',
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('address', 'totalBalance')
  }

}
