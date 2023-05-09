import { getConnection, In, Not } from 'typeorm'
import SyncProgress, { SyncAddressType } from 'database/chain/entities/sync-progress'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { HexString } from '@ckb-lumos/base'
import WalletService from './wallets'

export default class SyncProgressService {
  static async resetSyncProgress(
    params: {
      script: CKBComponents.Script
      scriptType: CKBRPC.ScriptType
      walletId: string
      addressType?: SyncAddressType
    }[]
  ) {
    await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .insert()
      .orIgnore()
      .values(params.map(v => SyncProgress.fromObject(v)))
      .execute()
  }

  static async removeWalletsByExists(existWalletIds: string[]) {
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ delete: true })
      .where({ walletId: Not(In(existWalletIds)) })
      .execute()
  }

  static async removeByHashesAndAddressType(addressType: SyncAddressType, existHashes?: string[]) {
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ delete: true })
      .where({ ...(existHashes?.length ? { hash: Not(In(existHashes)) } : {}), addressType })
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
      .where({ delete: false, hash: scriptHash })
      .getOne()
    return res
  }

  static async getAllSyncStatusToMap() {
    const result: Map<CKBComponents.Hash, SyncProgress> = new Map()
    const syncProgresses = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ delete: false })
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

  static async getCurrentWalletMinBlockNumber() {
    const currentWallet = WalletService.getInstance().getCurrent()
    const item = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ delete: false, ...(currentWallet ? { walletId: currentWallet.id } : {}) })
      .orderBy('blockEndNumber', 'ASC')
      .getOne()
    return item?.blockEndNumber || 0
  }

  static async getWalletMinBlockNumber() {
    const items = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .select('MIN(blockStartNumber) as blockStartNumber, walletId')
      .where({ addressType: SyncAddressType.Default })
      .groupBy('walletId')
      .getRawMany<{ blockStartNumber: number; walletId: string }>()
    return items.reduce<Record<string, number>>((pre, cur) => ({ ...pre, [cur.walletId]: cur.blockStartNumber }), {})
  }

  static async getSyncProgressByHashes(hashes: string[]) {
    return await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ hash: In(hashes) })
      .getMany()
  }

  static async clear() {
    const currentWallet = WalletService.getInstance().getCurrent()
    await getConnection()
      .getRepository(SyncProgress)
      .delete({ walletId: currentWallet?.id })
  }
}
