import { getConnection, In, Not } from 'typeorm'
import SyncProgress from 'database/chain/entities/sync-progress'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { HexString } from '@ckb-lumos/base'

export default class SyncProgressService {
  static async resetSyncProgress(
    params: { script: CKBComponents.Script; scriptType: CKBRPC.ScriptType; walletId: string }[]
  ) {
    await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .insert()
      .orIgnore()
      .values(params.map(v => SyncProgress.fromObject(v)))
      .execute()
    const walletIds = [...new Set(params.map(v => v.walletId))]
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ delete: true })
      .where({ walletId: Not(In(walletIds)) })
      .execute()
  }

  static async updateBlockNumber(blake160s: string[], blockNumber: number) {
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ blockStartNumber: blockNumber })
      .where({ blake160s: In(blake160s) })
      .execute()
  }

  static async getSyncStatus(script: CKBComponents.Script) {
    const scriptHash = scriptToHash(script)
    const res = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ softDelete: false, hash: scriptHash })
      .getOne()
    return res
  }

  static async getAllSyncStatusToMap() {
    const result: Map<CKBComponents.Hash, SyncProgress> = new Map()
    const syncProgresses = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ softDelete: false })
      .getMany()
    syncProgresses.forEach(v => {
      result.set(v.hash, v)
    })
    return result
  }

  static async updateSyncStatus(
    hash: HexString,
    { blockStartNumber, blockEndNumber, cursor }: { blockStartNumber: number; blockEndNumber: number; cursor?: string }
  ) {
    await getConnection().manager.update(SyncProgress, { hash }, { blockStartNumber, blockEndNumber, cursor })
  }

  static async getMinBlockNumber() {
    const item = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .orderBy('blockEndNumber', 'ASC')
      .getOne()
    return item?.blockEndNumber || 0
  }

  static async clear() {
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ blockStartNumber: 0, blockEndNumber: 0 })
      .execute()
  }
}
