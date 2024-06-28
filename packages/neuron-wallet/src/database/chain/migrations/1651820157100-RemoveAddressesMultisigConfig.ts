import { MigrationInterface, QueryRunner } from "typeorm"
import { addressToScript } from '../../../utils/scriptAndAddress'
import MultisigConfig from "../entities/multisig-config"

export class RemoveAddressesMultisigConfig1651820157100 implements MigrationInterface {
    name = 'RemoveAddressesMultisigConfig1651820157100'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.renameColumn('multisig_config', 'addresses', 'blake160s')
      await queryRunner.dropColumn('multisig_config', 'fullpayload')
      // after add a column for multisig_config here will throw exception if use `queryRunner.manager.find(MultisigConfig)`
      // so it's better to use query to find the items
      const configList: MultisigConfig[] = await queryRunner.manager.query('select * from multisig_config')
      const updated = configList.map(v => {
        v.blake160s = v.blake160s.map(v => addressToScript(v).args)
        return v
      })
      await queryRunner.manager.save(updated)
    }

    public async down(): Promise<void> {
      // do nothing
    }

}
