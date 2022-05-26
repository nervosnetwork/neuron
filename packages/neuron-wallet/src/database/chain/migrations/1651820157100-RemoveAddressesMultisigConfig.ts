import { MigrationInterface, QueryRunner } from "typeorm"
import { addressToScript } from "@nervosnetwork/ckb-sdk-utils"
import MultisigConfig from "../entities/multisig-config"

export class RemoveAddressesMultisigConfig1651820157100 implements MigrationInterface {
    name = 'RemoveAddressesMultisigConfig1651820157100'

    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.renameColumn('multisig_config', 'addresses', 'blake160s')
      await queryRunner.dropColumn('multisig_config', 'fullpayload')
      const configList = await queryRunner.manager.find(MultisigConfig)
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
