import { MigrationInterface, QueryRunner } from "typeorm";
import { scriptToAddress, addressToScript } from '../../../utils/scriptAndAddress'
import AddressDescription from '../entities/address-description'

export class UpdateAddressDescription1650984779265 implements MigrationInterface {
  name = 'UpdateAddressDescription1650984779265'

  public async up(queryRunner: QueryRunner): Promise<any> {
    const descList = await queryRunner.manager.find(AddressDescription)
    const updated = descList.map(desc => {
      desc.address = scriptToAddress(addressToScript(desc.address), desc.address.startsWith('ckb'))
      return desc
    })
    await queryRunner.manager.save(updated)
  }

  public async down(): Promise<void> {
    // do nothing
  }

}
