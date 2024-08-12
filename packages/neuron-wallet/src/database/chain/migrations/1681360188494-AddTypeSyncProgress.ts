import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm"
import Multisig from "../../../models/multisig"
import { computeScriptHash as scriptToHash } from '@ckb-lumos/lumos/utils'
import { SyncAddressType } from "../entities/sync-progress"
import MultisigConfig from "../entities/multisig-config"

export class AddTypeSyncProgress1681360188494 implements MigrationInterface {
  name = 'AddTypeSyncProgress1681360188494'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('sync_progress', new TableColumn({
      name: 'addressType',
      type: 'INTEGER',
      isNullable: false,
      default: SyncAddressType.Default,
    }))
    await queryRunner.createIndex("sync_progress", new TableIndex({ columnNames: ["addressType"] }))
    // after add a column for multisig_config here will throw exception if use `queryRunner.manager.find(MultisigConfig)`
    // so it's better to use query to find the items
    const multisigConfigs: MultisigConfig[] = await queryRunner.manager.query('select * from multisig_config')
    const scriptHashes = multisigConfigs.map(v => scriptToHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n)))
    await queryRunner.query(`UPDATE sync_progress set addressType=1 where hash in (${scriptHashes.map(v => `'${v}'`).join(',')})`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sync_progress', 'addressType')
    await queryRunner.dropIndex("sync_progress", new TableIndex({ columnNames: ["addressType"] }))
  }

}
