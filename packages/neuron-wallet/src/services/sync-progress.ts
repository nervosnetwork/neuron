import { getConnection, In, LessThan, Not } from 'typeorm'
import { computeScriptHash as scriptToHash } from '@ckb-lumos/base/lib/utils'
import SyncProgress, { SyncAddressType } from '../database/chain/entities/sync-progress'
import WalletService from './wallets'

export default class SyncProgressService {
  static async initSyncProgress(
    params: {
      script: CKBComponents.Script
      scriptType: CKBRPC.ScriptType
      walletId: string
      addressType?: SyncAddressType
      blockNumber: string
    }[]
  ) {
    const syncProgresses = params.map(v => SyncProgress.fromObject(v))
    const existProgresses = await getConnection()
      .getRepository(SyncProgress)
      .find({
        select: ['hash'],
      })
    const existHashes = new Set(existProgresses.map(v => v.hash))
    const newSyncProgreses = syncProgresses.filter(v => !existHashes.has(v.hash))
    await getConnection().manager.save(newSyncProgreses, { chunk: 100 })
  }

  static async updateSyncProgressFlag(existWalletIds: string[]) {
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ delete: true })
      .where({ walletId: Not(In(existWalletIds)) })
      .execute()
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ delete: false })
      .where({ walletId: In(existWalletIds) })
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
      .set({ localSavedBlockNumber: blockNumber })
      .where({ args: In(blake160s), localSavedBlockNumber: LessThan(blockNumber) })
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

  static async getCurrentWalletMinSyncedBlockNumber() {
    const currentWallet = WalletService.getInstance().getCurrent()
    const item = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({
        delete: false,
        addressType: SyncAddressType.Default,
        ...(currentWallet ? { walletId: currentWallet.id } : {}),
      })
      .orderBy('syncedBlockNumber', 'ASC')
      .getOne()
    return item?.syncedBlockNumber || 0
  }

  static async getWalletMinLocalSavedBlockNumber() {
    const items = await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .select('MIN(localSavedBlockNumber) as localSavedBlockNumber, walletId')
      .where({ addressType: SyncAddressType.Default })
      .groupBy('walletId')
      .getRawMany<{ localSavedBlockNumber: number; walletId: string }>()
    return items.reduce<Record<string, number>>(
      (pre, cur) => ({ ...pre, [cur.walletId]: cur.localSavedBlockNumber }),
      {}
    )
  }

  static async getOtherTypeSyncBlockNumber() {
    const items = await getConnection().getRepository(SyncProgress).find({
      addressType: SyncAddressType.Multisig,
    })
    return items.reduce<Record<string, number>>((pre, cur) => ({ ...pre, [cur.hash]: cur.localSavedBlockNumber }), {})
  }

  static async getSyncProgressByHashes(hashes: string[]) {
    return await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ hash: In(hashes) })
      .getMany()
  }

  static async clearWalletProgress() {
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ localSavedBlockNumber: 0, syncedBlockNumber: 0 })
      .execute()
  }
}
