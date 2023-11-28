import { BI } from '@ckb-lumos/bi'
import { Subject } from 'rxjs'
import { queue, QueueObject } from 'async'
import type { HexString, QueryOptions, TransactionWithStatus } from '@ckb-lumos/base'
import { Indexer as CkbIndexer, CellCollector } from '@ckb-lumos/ckb-indexer'
import logger from '../../utils/logger'
import { Address } from '../../models/address'
import AddressMeta from '../../database/address/meta'
import { scheduler } from 'timers/promises'
import SyncProgressService from '../../services/sync-progress'
import { BlockTips, LumosCellQuery, Connector, AppendScript } from './connector'
import { computeScriptHash as scriptToHash } from '@ckb-lumos/base/lib/utils'
import { FetchTransactionReturnType, LightRPC, LightScriptFilter } from '../../utils/ckb-rpc'
import Multisig from '../../services/multisig'
import { SyncAddressType } from '../../database/chain/entities/sync-progress'
import WalletService from '../../services/wallets'
import AssetAccountInfo from '../../models/asset-account-info'
import { DepType } from '../../models/chain/cell-dep'
import { molecule } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'
import type { Base } from '@ckb-lumos/rpc/lib/Base'

interface SyncQueueParam {
  script: CKBComponents.Script
  scriptType: CKBRPC.ScriptType
  blockRange: [HexString, HexString]
  cursor?: HexString
}

const unpackGroup = molecule.vector(blockchain.OutPoint)

export default class LightConnector extends Connector<CKBComponents.Hash> {
  private lightRpc: LightRPC
  private indexer: CkbIndexer
  private addressMetas: AddressMeta[]
  private syncQueue: QueueObject<SyncQueueParam> = queue(this.syncNextWithScript.bind(this), 1)
  private indexerQueryQueue: QueueObject<LumosCellQuery> | undefined
  private pollingIndexer: boolean = false
  private syncInQueue: Map<CKBComponents.Hash, { blockStartNumber: number; blockEndNumber: number; cursor?: string }> =
    new Map()

  public readonly blockTipsSubject: Subject<BlockTips> = new Subject<BlockTips>()
  public readonly transactionsSubject = new Subject<{ txHashes: CKBComponents.Hash[]; params: CKBComponents.Hash }>()

  constructor(addresses: Address[], nodeUrl: string) {
    super()
    this.indexer = new CkbIndexer(nodeUrl, nodeUrl)
    this.lightRpc = new LightRPC(nodeUrl)
    this.addressMetas = addresses.map(address => AddressMeta.fromObject(address))
    this.indexerQueryQueue = queue(this.collectLiveCellsByScript.bind(this))

    // fetch some dep cell
    this.fetchDepCell()
  }

  private async getDepTxs(): Promise<string[]> {
    const assetAccountInfo = new AssetAccountInfo()
    const fetchCellDeps = [
      assetAccountInfo.anyoneCanPayCellDep,
      assetAccountInfo.sudtCellDep,
      assetAccountInfo.getNftClassInfo().cellDep,
      assetAccountInfo.getNftInfo().cellDep,
      assetAccountInfo.getNftIssuerInfo().cellDep,
      assetAccountInfo.getLegacyAnyoneCanPayInfo().cellDep,
      assetAccountInfo.getChequeInfo().cellDep,
      ...assetAccountInfo.getSporeInfos().map(info => info.cellDep),
      ...assetAccountInfo.getSporeClusterInfo().map(info => info.cellDep),
    ]
    const fetchTxHashes = fetchCellDeps.map(v => v.outPoint.txHash).map<[string, string]>(v => ['fetchTransaction', v])
    const txs = await this.lightRpc
      .createBatchRequest<any, string[], FetchTransactionReturnType[]>(fetchTxHashes)
      .exec()
    if (txs.some(v => !v.txWithStatus)) {
      // wait for light client sync the dep cell
      await scheduler.wait(10000)
      return await this.getDepTxs()
    }
    return fetchCellDeps
      .map((v, idx) => {
        if (v.depType === DepType.DepGroup) {
          const tx = txs[idx]
          return tx?.txWithStatus ? tx?.txWithStatus?.transaction?.outputsData?.[+v.outPoint.index] : undefined
        }
      })
      .filter<string>((v): v is string => !!v)
  }

  private async fetchDepCell() {
    const depGroupOutputsData: string[] = await this.getDepTxs()
    const depGroupTxHashes = [...new Set(depGroupOutputsData.map(v => unpackGroup.unpack(v).map(v => v.txHash)).flat())]
    if (depGroupTxHashes.length) {
      await this.lightRpc
        .createBatchRequest<any, string[], FetchTransactionReturnType[]>(
          depGroupTxHashes.map(v => ['fetchTransaction', v])
        )
        .exec()
    }
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
            args: v.args,
          },
          blockRange: [BI.from(v.blockStartNumber).toHexString(), BI.from(v.blockEndNumber).toHexString()],
          scriptType: v.scriptType,
          cursor: v.cursor,
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
          blockRange: [BI.from(syncStatus.blockEndNumber).toHexString(), syncScript.blockNumber],
          scriptType: syncScript.scriptType,
          cursor: undefined,
        })
      }
    })
  }

  private async subscribeSync() {
    const minSyncBlockNumber = await SyncProgressService.getCurrentWalletMinBlockNumber()
    const header = await this.lightRpc.getTipHeader()
    this.blockTipsSubject.next({
      cacheTipNumber: minSyncBlockNumber,
      indexerTipNumber: +header.number,
    })
  }

  private async initSyncProgress(appendScripts: AppendScript[] = []) {
    if (!this.addressMetas.length && !appendScripts.length) {
      return
    }
    const syncScripts = await this.lightRpc.getScripts()
    const existSyncscripts: Record<string, LightScriptFilter> = {}
    syncScripts.forEach(v => {
      existSyncscripts[scriptToHash(v.script)] = v
    })
    const currentWalletId = WalletService.getInstance().getCurrent()?.id
    const allScripts = this.addressMetas
      .filter(v => (currentWalletId ? v.walletId === currentWalletId : true))
      .map(addressMeta => {
        const lockScripts = [
          addressMeta.generateDefaultLockScript(),
          addressMeta.generateACPLockScript(),
          addressMeta.generateLegacyACPLockScript(),
        ]
        return lockScripts.map(v => ({
          script: v.toSDK(),
          scriptType: 'lock' as CKBRPC.ScriptType,
          walletId: addressMeta.walletId,
        }))
      })
      .flat()
    const walletMinBlockNumber = await SyncProgressService.getWalletMinBlockNumber()
    const wallets = await WalletService.getInstance().getAll()
    const walletStartBlockMap = wallets.reduce<Record<string, string | undefined>>(
      (pre, cur) => ({ ...pre, [cur.id]: cur.startBlockNumber }),
      {}
    )
    const otherTypeSyncProgress = await SyncProgressService.getOtherTypeSyncProgress()
    const setScriptsParams = [
      ...allScripts.map(v => {
        let syncedBlockNumber = existSyncscripts[scriptToHash(v.script)]?.blockNumber
        const walletStartBlockNumber = walletStartBlockMap[v.walletId]
        if (
          walletStartBlockNumber &&
          (!syncedBlockNumber || BigInt(syncedBlockNumber) < BigInt(walletStartBlockNumber))
        ) {
          syncedBlockNumber = walletStartBlockNumber
        }
        return {
          ...v,
          blockNumber: syncedBlockNumber ?? `0x${(walletMinBlockNumber?.[v.walletId] ?? 0).toString(16)}`,
        }
      }),
      ...appendScripts.map(v => ({
        ...v,
        blockNumber:
          existSyncscripts[scriptToHash(v.script)]?.blockNumber ??
          `0x${(otherTypeSyncProgress[scriptToHash(v.script)] ?? 0).toString(16)}`,
      })),
    ]
    await this.lightRpc.setScripts(setScriptsParams)
    const walletIds = [...new Set(this.addressMetas.map(v => v.walletId))]
    await SyncProgressService.resetSyncProgress([allScripts, appendScripts].flat())
    await SyncProgressService.updateSyncProgressFlag(walletIds)
    await SyncProgressService.removeByHashesAndAddressType(
      SyncAddressType.Multisig,
      appendScripts.map(v => scriptToHash(v.script))
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
        cursor: undefined,
      })
      return
    }
    const txHashes = result.txs.map(v => v.txHash)
    await this.fetchPreviousOutputs(txHashes)
    this.transactionsSubject.next({ txHashes, params: syncProgress.hash })
    this.syncInQueue.set(syncProgress.hash, {
      blockStartNumber: result.lastCursor === '0x' ? parseInt(blockRange[1]) : parseInt(blockRange[0]),
      blockEndNumber: parseInt(blockRange[1]),
      cursor: result.lastCursor === '0x' ? undefined : result.lastCursor,
    })
  }

  private async fetchPreviousOutputs(txHashes: string[]) {
    const transactions = await this.lightRpc
      .createBatchRequest<'getTransaction', string[], TransactionWithStatus[]>(txHashes.map(v => ['getTransaction', v]))
      .exec()
    const previousTxHashes = new Set<string>()
    transactions
      .flatMap(tx => tx.transaction.inputs)
      .forEach(input => {
        const previousTxHash = input.previousOutput!.txHash
        // exclude the cell base transaction in a block
        if (previousTxHash !== `0x${'0'.repeat(64)}`) {
          previousTxHashes.add(previousTxHash)
        }
      })
    await this.lightRpc.createBatchRequest([...previousTxHashes].map(v => ['fetchTransaction' as keyof Base, v])).exec()
  }

  private async collectLiveCellsByScript(query: LumosCellQuery) {
    const { lock, type, data } = query
    if (!lock && !type) {
      throw new Error('at least one script is required')
    }

    const queries: QueryOptions = {}
    if (lock) {
      queries.lock = lock
    }
    if (type) {
      queries.type = type
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
    this.initSyncProgress(scripts)
  }
}
