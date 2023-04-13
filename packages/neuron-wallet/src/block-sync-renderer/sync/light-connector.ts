import { Subject } from 'rxjs'
import { queue, QueueObject } from 'async'
import { HexString, QueryOptions } from '@ckb-lumos/base'
import { CkbIndexer, CellCollector } from '@nervina-labs/ckb-indexer'
import logger from 'utils/logger'
import { Address } from 'models/address'
import AddressMeta from 'database/address/meta'
import { scheduler } from 'timers/promises'
import SyncProgressService from 'services/sync-progress'
import { BlockTips, LumosCellQuery, Connector, AppendScript } from './connector'
import { scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { LightRPC, LightScriptFilter } from '../../utils/ckb-rpc'
import HexUtils from 'utils/hex'
import Multisig from 'services/multisig'
import { SyncAddressType } from 'database/chain/entities/sync-progress'
import WalletService from 'services/wallets'

interface SyncQueueParam {
  script: CKBComponents.Script
  scriptType: CKBRPC.ScriptType
  blockRange: [HexString, HexString]
  cursor?: HexString
}

export default class LightConnector extends Connector<CKBComponents.Hash> {
  private lightRpc: LightRPC
  private indexer: CkbIndexer
  private addressMetas: AddressMeta[]
  private syncQueue: QueueObject<SyncQueueParam> = queue(this.syncNextWithScript.bind(this), 1)
  private indexerQueryQueue: QueueObject<LumosCellQuery> | undefined
  private pollingIndexer: boolean = false
  private syncInQueue: Map<
    CKBComponents.Hash,
    { blockStartNumber: number; blockEndNumber: number; cursor?: string }
  > = new Map()

  public readonly blockTipsSubject: Subject<BlockTips> = new Subject<BlockTips>()
  public readonly transactionsSubject = new Subject<{ txHashes: CKBComponents.Hash[]; params: CKBComponents.Hash }>()

  constructor(addresses: Address[], nodeUrl: string) {
    super()
    this.indexer = new CkbIndexer(nodeUrl, nodeUrl)
    this.lightRpc = new LightRPC(nodeUrl)
    this.addressMetas = addresses.map(address => AddressMeta.fromObject(address))

    this.indexerQueryQueue = queue(this.collectLiveCellsByScript)
  }

  private async synchronize() {
    if (!this.syncQueue.idle()) {
      return
    }
    await this.subscribeSync()
    const syncScripts = await this.lightRpc.getScripts()
    const syncStatusMap = await SyncProgressService.getAllSyncStatusToMap()
    syncStatusMap.forEach(v => {
      if (v.cursor && !this.syncInQueue.has(v.hash)) {
        this.syncQueue.push({
          script: {
            codeHash: v.codeHash,
            hashType: v.hashType,
            args: v.args
          },
          blockRange: [HexUtils.toHex(v.blockStartNumber), HexUtils.toHex(v.blockEndNumber)],
          scriptType: v.scriptType,
          cursor: v.cursor
        })
      }
    })
    syncScripts.forEach(syncScript => {
      const scriptHash = scriptToHash(syncScript.script)
      const syncStatus = syncStatusMap.get(scriptHash)
      if (
        syncStatus &&
        !this.syncInQueue.has(scriptHash) &&
        !syncStatus.cursor &&
        syncStatus.blockEndNumber < parseInt(syncScript.blockNumber)
      ) {
        this.syncQueue.push({
          script: syncScript.script,
          blockRange: [HexUtils.toHex(syncStatus.blockEndNumber), syncScript.blockNumber],
          scriptType: syncScript.scriptType,
          cursor: undefined
        })
      }
    })
  }

  private async subscribeSync() {
    const minSyncBlockNumber = await SyncProgressService.getCurrentWalletMinBlockNumber()
    const header = await this.lightRpc.getTipHeader()
    this.blockTipsSubject.next({
      cacheTipNumber: minSyncBlockNumber,
      indexerTipNumber: +header.number
    })
  }

  private async initSyncProgress(appendScripts?: AppendScript[]) {
    if (!this.addressMetas.length && !appendScripts?.length) {
      return
    }
    const sycnScripts = await this.lightRpc.getScripts()
    const existSyncscripts: Record<string, LightScriptFilter> = {}
    sycnScripts.forEach(v => {
      existSyncscripts[scriptToHash(v.script)] = v
    })
    const currentWalletId = WalletService.getInstance().getCurrent()?.id
    const allScripts = this.addressMetas
      .filter(v => (currentWalletId ? v.walletId === currentWalletId : true))
      .map(addressMeta => {
        const lockScripts = [
          addressMeta.generateDefaultLockScript(),
          addressMeta.generateACPLockScript(),
          addressMeta.generateLegacyACPLockScript()
        ]
        return lockScripts.map(v => ({
          script: v.toSDK(),
          scriptType: 'lock' as CKBRPC.ScriptType,
          walletId: addressMeta.walletId
        }))
      })
      .flat()
      .concat(appendScripts ?? [])
    const walletMinBlockNumber = await SyncProgressService.getWalletMinBlockNumber()
    const wallets = await WalletService.getInstance().getAll()
    const walletStartBlockMap = wallets.reduce<Record<string, string | undefined>>(
      (pre, cur) => ({ ...pre, [cur.id]: cur.startBlockNumberInLight }),
      {}
    )
    const setScriptsParams = allScripts.map(v => ({
      ...v,
      blockNumber:
        existSyncscripts[scriptToHash(v.script)]?.blockNumber ??
        walletStartBlockMap[v.walletId] ??
        `0x${(walletMinBlockNumber?.[v.walletId] ?? 0).toString(16)}`
    }))
    await this.lightRpc.setScripts(setScriptsParams)
    await SyncProgressService.resetSyncProgress(allScripts)
    const walletIds = [...new Set(this.addressMetas.map(v => v.walletId))]
    await SyncProgressService.removeWalletsByExists(walletIds)
    await SyncProgressService.removeByHashesAndAddressType(
      SyncAddressType.Multisig,
      appendScripts?.map(v => scriptToHash(v.script))
    )
  }

  private async initSync() {
    const appendScripts = await Multisig.getMultisigConfigForLight()
    await this.initSyncProgress(appendScripts)
    while (this.pollingIndexer) {
      await this.synchronize()
      await scheduler.wait(5000)
    }
  }

  private async syncNextWithScript({ script, scriptType, blockRange, cursor }: SyncQueueParam) {
    const syncProgress = await SyncProgressService.getSyncStatus(script)
    if (!syncProgress) {
      return
    }
    const result = await this.lightRpc.getTransactions({ script, blockRange, scriptType }, 'asc', '0x64', cursor!)
    if (!result.txs.length) {
      await SyncProgressService.updateSyncStatus(syncProgress.hash, {
        blockStartNumber: parseInt(blockRange[1]),
        blockEndNumber: parseInt(blockRange[1]),
        cursor: undefined
      })
      return
    }
    this.transactionsSubject.next({ txHashes: result.txs.map(v => v.txHash), params: syncProgress.hash })
    this.syncInQueue.set(syncProgress.hash, {
      blockStartNumber: result.lastCursor === '0x' ? parseInt(blockRange[1]) : parseInt(blockRange[0]),
      blockEndNumber: parseInt(blockRange[1]),
      cursor: result.lastCursor === '0x' ? undefined : result.lastCursor
    })
  }

  private async collectLiveCellsByScript(query: LumosCellQuery) {
    const { lock, type, data } = query
    if (!lock && !type) {
      throw new Error('at least one script is required')
    }

    const queries: QueryOptions = {}
    if (lock) {
      queries.lock = {
        code_hash: lock.codeHash,
        hash_type: lock.hashType,
        args: lock.args
      }
    }
    if (type) {
      queries.type = {
        code_hash: type.codeHash,
        hash_type: type.hashType,
        args: type.args
      }
    }
    queries.data = data || 'any'

    const collector = new CellCollector(this.indexer, queries)

    const result = []
    for await (const cell of collector.collect()) {
      result.push(cell)
    }
    return result
  }

  public async connect() {
    try {
      logger.info('LightConnector:\tconnect ...:')
      this.pollingIndexer = true
      this.initSync()
    } catch (error) {
      logger.error(`Error connecting to Light: ${error.message}`)
      throw error
    }
  }

  public stop(): void {
    this.pollingIndexer = false
  }

  public async getLiveCellsByScript(query: LumosCellQuery) {
    return new Promise((resolve, reject) => {
      this.indexerQueryQueue!.push(query, (err: any, result: unknown) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  public async notifyCurrentBlockNumberProcessed(hash: CKBComponents.Hash) {
    const nextSyncParams = this.syncInQueue.get(hash)
    if (nextSyncParams) {
      try {
        await SyncProgressService.updateSyncStatus(hash, nextSyncParams)
      } finally {
        this.syncInQueue.delete(hash)
      }
    }
    await this.subscribeSync()
  }

  async appendScript(scripts: AppendScript[]) {
    if (!scripts.length) {
      return
    }
    this.initSyncProgress(scripts)
  }
}
