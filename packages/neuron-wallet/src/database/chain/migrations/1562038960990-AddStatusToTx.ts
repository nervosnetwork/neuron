import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddStatusToTx1562038960990 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('transaction', new TableColumn({
        name: 'status',
        type: 'varchar',
      }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropColumn('transaction', 'status')
    }

}
