import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddSince1558491231870 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.addColumn('input', new TableColumn({
      name: 'since',
      type: 'varchar',
    }))
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.dropColumn('input', 'since')
  }

}
