import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class UpdateAssetAccount1587368167604 implements MigrationInterface {
    name = 'UpdateAssetAccount1587368167604'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('asset_account', new TableColumn({
        name: 'accountName',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }))
      await queryRunner.addColumn('asset_account', new TableColumn({
        name: 'tokenName',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }))
      await queryRunner.dropColumn('asset_account', 'fullName')
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.addColumn('asset_account', new TableColumn({
        name: 'fullName',
        type: 'varchar',
        isNullable: false,
        default: `''`,
      }))
      await queryRunner.dropColumn('asset_account', 'accountName')
      await queryRunner.dropColumn('asset_account', 'tokenName')
    }

}
