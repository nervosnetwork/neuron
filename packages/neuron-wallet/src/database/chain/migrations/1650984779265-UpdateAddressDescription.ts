import { MigrationInterface, QueryRunner } from 'typeorm'
import AddressDescription from '../entities/address-description'
import { config, helpers } from '@ckb-lumos/lumos'

export class UpdateAddressDescription1650984779265 implements MigrationInterface {
  name = 'UpdateAddressDescription1650984779265'

  public async up(queryRunner: QueryRunner): Promise<any> {
    const descList = await queryRunner.manager.find(AddressDescription)

    const updated = descList.map(desc => {
      const isMainnet = desc.address.startsWith('ckb')
      const lumosOptions = isMainnet ? { config: config.predefined.LINA } : { config: config.predefined.AGGRON4 }
      desc.address = helpers.encodeToAddress(helpers.addressToScript(desc.address), lumosOptions)
      return desc
    })
    await queryRunner.manager.save(updated)
  }

  public async down(): Promise<void> {
    // do nothing
  }
}
