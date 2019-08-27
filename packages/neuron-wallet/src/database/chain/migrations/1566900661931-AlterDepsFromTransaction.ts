import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterDepsFromTransaction1566900661931 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('transaction', new TableColumn({
        name: 'cellDeps',
        type: 'simple-json',
        default: [],
      }))

      await queryRunner.addColumn('transaction', new TableColumn({
        name: 'headerDeps',
        type: 'simple-json',
        default: [],
      }))

      await queryRunner.dropColumn('transaction', 'deps')
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('transaction', new TableColumn({
        name: 'deps',
        type: 'simple-json',
        default: [],
      }))

      await queryRunner.dropColumn('transaction', 'cellDeps')
      await queryRunner.dropColumn('transaction', 'headerDeps')
    }

}
