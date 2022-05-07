import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveAddressesMultisigConfig1651820157092 implements MigrationInterface {
    name = 'RemoveAddressesMultisigConfig1651820157092'

    public async up(queryRunner: QueryRunner): Promise<any> {
      const configList = await queryRunner.query('select * from multisig_config')
      console.log(configList)
      console.log(configList.length)
    }

    public async down(): Promise<void> {
      // do nothing
    }

}
