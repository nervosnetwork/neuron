import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm'
import Multisig from '../../../models/multisig'
import { SyncAddressType } from '../entities/sync-progress'
import MultisigConfig from '../entities/multisig-config'
import { utils } from '@ckb-lumos/lumos'

export class AddTypeSyncProgress1681360188494 implements MigrationInterface {
  name = 'AddTypeSyncProgress1681360188494'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'sync_progress',
      new TableColumn({
        name: 'addressType',
        type: 'INTEGER',
        isNullable: false,
        default: SyncAddressType.Default,
      })
    )
    await queryRunner.createIndex('sync_progress', new TableIndex({ columnNames: ['addressType'] }))
    const multisigConfigs = await queryRunner.connection.getRepository(MultisigConfig).createQueryBuilder().getMany()
    const scriptHashes = multisigConfigs.map(v =>
      utils.computeScriptHash(Multisig.getMultisigScript(v.blake160s, v.r, v.m, v.n))
    )
    await queryRunner.query(
      `UPDATE sync_progress set addressType=1 where hash in (${scriptHashes.map(v => `'${v}'`).join(',')})`
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('sync_progress', 'addressType')
    await queryRunner.dropIndex('sync_progress', new TableIndex({ columnNames: ['addressType'] }))
  }
}
