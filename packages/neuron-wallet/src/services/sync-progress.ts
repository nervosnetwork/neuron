import { Equal, getConnection, In, Not } from 'typeorm'
import { utils } from '@ckb-lumos/lumos'
import { HexString } from '@ckb-lumos/base'
import SyncProgress, { SyncAddressType } from '../database/chain/entities/sync-progress'
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
      .set({ blockStartNumber: blockNumber })
      .where({ blake160s: In(blake160s) })
      .execute()
  }

  static async getSyncStatus(script: CKBComponents.Script) {
    const scriptHash = utils.computeScriptHash(script)
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
      .where({
        delete: false,
        addressType: SyncAddressType.Default,
        ...(currentWallet ? { walletId: currentWallet.id } : {}),
      })
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

  static async getOtherTypeSyncProgress() {
    const items = await getConnection().getRepository(SyncProgress).find({
      addressType: SyncAddressType.Multisig,
    })
    return items.reduce<Record<string, number>>((pre, cur) => ({ ...pre, [cur.hash]: cur.blockStartNumber }), {})
  }

  static async getSyncProgressByHashes(hashes: string[]) {
    return await getConnection()
      .getRepository(SyncProgress)
      .createQueryBuilder()
      .where({ hash: In(hashes) })
      .getMany()
  }

  static async clearCurrentWalletProgress() {
    const currentWallet = WalletService.getInstance().getCurrent()
    await getConnection().getRepository(SyncProgress).delete({ walletId: currentWallet?.id })
    await getConnection()
      .createQueryBuilder()
      .update(SyncProgress)
      .set({ blockEndNumber: 0, cursor: undefined })
      .where({ walletId: Not(Equal(currentWallet?.id)) })
      .execute()
  }
}
