import {MigrationInterface, QueryRunner, TableColumn, TableIndex} from "typeorm";

export class AddTypeToInput1587371249814 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('input', new TableColumn({
        name: 'typeCodeHash',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('input', new TableColumn({
        name: 'typeArgs',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('input', new TableColumn({
        name: 'typeHashType',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('input', new TableColumn({
        name: 'typeHash',
        type: 'varchar',
        isNullable: true,
      }))

      await queryRunner.addColumn('input', new TableColumn({
        name: 'data',
        type: 'varchar',
        default: `'0x'`,
      }))

      await queryRunner.addColumn('output', new TableColumn({
        name: 'data',
        type: 'varchar',
        default: `'0x'`,
      }))

      await queryRunner.createIndex("input", new TableIndex({ columnNames: ["typeHash"] }))
      await queryRunner.createIndex("input", new TableIndex({ columnNames: ["typeCodeHash"] }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropIndex("input", new TableIndex({ columnNames: ["typeHash"] }))
      await queryRunner.dropIndex("input", new TableIndex({ columnNames: ["typeCodeHash"] }))

      await queryRunner.dropColumn('input', 'typeCodeHash')
      await queryRunner.dropColumn('input', 'typeArgs')
      await queryRunner.dropColumn('input', 'typeHashType')
      await queryRunner.dropColumn('input', 'typeHash')
      await queryRunner.dropColumn('input', 'data')
      await queryRunner.dropColumn('output', 'data')
    }
}
