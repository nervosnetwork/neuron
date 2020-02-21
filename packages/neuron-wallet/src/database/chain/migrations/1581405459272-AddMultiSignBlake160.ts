import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class AddMultiSignBlake1601581405459272 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.addColumn('input', new TableColumn({
            name: 'multiSignBlake160',
            type: 'varchar',
            isNullable: true,
        }))
        await queryRunner.addColumn('output', new TableColumn({
            name: 'multiSignBlake160',
            type: 'varchar',
            isNullable: true,
        }))
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.dropColumn('input', 'multiSignBlake160')
        await queryRunner.dropColumn('output', 'multiSignBlake160')
    }

}
