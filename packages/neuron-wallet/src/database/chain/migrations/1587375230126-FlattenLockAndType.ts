import {MigrationInterface, QueryRunner, TableColumn, TableIndex} from "typeorm";

export class FlattenLockAndType1587375230126 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('output', new TableColumn({
        name: 'lockCodeHash',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('output', new TableColumn({
        name: 'lockArgs',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('output', new TableColumn({
        name: 'lockHashType',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('output', new TableColumn({
        name: 'typeCodeHash',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('output', new TableColumn({
        name: 'typeArgs',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('output', new TableColumn({
        name: 'typeHashType',
        type: 'varchar',
        isNullable: true,
      }))

      await queryRunner.addColumn('input', new TableColumn({
        name: 'lockCodeHash',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('input', new TableColumn({
        name: 'lockArgs',
        type: 'varchar',
        isNullable: true,
      }))
      await queryRunner.addColumn('input', new TableColumn({
        name: 'lockHashType',
        type: 'varchar',
        isNullable: true,
      }))

      await queryRunner.query(`UPDATE output SET lockCodeHash = json_extract(lock, '$.codeHash');`)
      await queryRunner.query(`UPDATE output SET lockArgs = json_extract(lock, '$.args');`)
      await queryRunner.query(`UPDATE output SET lockHashType = json_extract(lock, '$.hashType');`)

      await queryRunner.query(`UPDATE output SET typeCodeHash = json_extract(typeScript, '$.codeHash');`)
      await queryRunner.query(`UPDATE output SET typeArgs = json_extract(typeScript, '$.args');`)
      await queryRunner.query(`UPDATE output SET typeHashType = json_extract(typeScript, '$.hashType');`)

      await queryRunner.query(`UPDATE input SET lockCodeHash = json_extract(lock, '$.codeHash');`)
      await queryRunner.query(`UPDATE input SET lockArgs = json_extract(lock, '$.args');`)
      await queryRunner.query(`UPDATE input SET lockHashType = json_extract(lock, '$.hashType');`)

      await queryRunner.changeColumn('output', 'lockCodeHash', new TableColumn({
        name: 'lockCodeHash',
        type: 'varchar',
        isNullable: false
      }))
      await queryRunner.changeColumn('output', 'lockArgs', new TableColumn({
        name: 'lockArgs',
        type: 'varchar',
        isNullable: false
      }))
      await queryRunner.changeColumn('output', 'lockHashType', new TableColumn({
        name: 'lockHashType',
        type: 'varchar',
        isNullable: false
      }))

      await queryRunner.dropColumn('input', 'lock')
      await queryRunner.dropColumn('output', 'lock')
      await queryRunner.dropColumn('output', 'typeScript')

      await queryRunner.createIndex("output", new TableIndex({ columnNames: ["typeHash"] }))
      await queryRunner.createIndex("output", new TableIndex({ columnNames: ["typeCodeHash"] }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.dropIndex("output", 'IDX_77f58dbdfbe8c9ba64d6c9429f')
      await queryRunner.dropIndex("output", 'IDX_1ed5d6c6f97066013a22ca4adb')

      await queryRunner.addColumn('output', new TableColumn({
        name: 'lock',
        type: 'text',
        isNullable: true,
      }))
      await queryRunner.addColumn('output', new TableColumn({
        name: 'typeScript',
        type: 'text',
        isNullable: true,
      }))
      await queryRunner.addColumn('input', new TableColumn({
        name: 'lock',
        type: 'text',
        isNullable: true,
      }))

      await queryRunner.query(`UPDATE output SET lock = json_object('codeHash', lockCodeHash, 'args', lockArgs, 'hashType', lockHashType);`)
      await queryRunner.query(`UPDATE output SET typeScript = CASE WHEN typeCodeHash IS NULL THEN NULL ELSE json_object('codeHash', typeCodeHash, 'args', typeArgs, 'hashType', typeHashType) END;`)
      await queryRunner.query(`UPDATE input SET lock = CASE WHEN lockCodeHash IS NULL THEN NULL ELSE json_object('codeHash', lockCodeHash, 'args', lockArgs, 'hashType', lockHashType) END;`)

      await queryRunner.changeColumn('output', 'lock', new TableColumn({
        name: 'lock',
        type: 'text',
        isNullable: false
      }))

      await queryRunner.dropColumn('output', 'lockCodeHash')
      await queryRunner.dropColumn('output', 'lockArgs')
      await queryRunner.dropColumn('output', 'lockHashType')
      await queryRunner.dropColumn('output', 'typeCodeHash')
      await queryRunner.dropColumn('output', 'typeArgs')
      await queryRunner.dropColumn('output', 'typeHashType')

      await queryRunner.dropColumn('input', 'lockCodeHash')
      await queryRunner.dropColumn('input', 'lockArgs')
      await queryRunner.dropColumn('input', 'lockHashType')
    }

}
