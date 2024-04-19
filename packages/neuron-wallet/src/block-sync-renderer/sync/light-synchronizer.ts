import type { HexString, Script, TransactionWithStatus } from '@ckb-lumos/base'
import logger from '../../utils/logger'
import { Address } from '../../models/address'
import AddressMeta from '../../database/address/meta'
import { scheduler } from 'timers/promises'
import SyncProgressService from '../../services/sync-progress'
import { Synchronizer, AppendScript } from './synchronizer'
import { computeScriptHash as scriptToHash } from '@ckb-lumos/base/lib/utils'
import { FetchTransactionReturnType, LightRPC, LightScriptFilter } from '../../utils/ckb-rpc'
import Multisig from '../../services/multisig'
import SyncProgress, { SyncAddressType } from '../../database/chain/entities/sync-progress'
import WalletService from '../../services/wallets'
import AssetAccountInfo from '../../models/asset-account-info'
import { DepType } from '../../models/chain/cell-dep'
import { molecule } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'
import type { Base } from '@ckb-lumos/rpc/lib/Base'
import { BI } from '@ckb-lumos/bi'
import IndexerCacheService from './indexer-cache-service'
import { ScriptType } from '@ckb-lumos/ckb-indexer/lib/type'
import { scriptToAddress } from '../../utils/scriptAndAddress'
import NetworksService from '../../services/networks'
import { getConnection } from '../../database/chain/connection'

const unpackGroup = molecule.vector(blockchain.OutPoint)

export default class LightSynchronizer extends Synchronizer {
  private lightRpc: LightRPC
  private addressMetas: AddressMeta[]

  constructor(addresses: Address[], nodeUrl: string) {
    super({
      addresses,
      nodeUrl,
      indexerUrl: nodeUrl,
    })
    this.lightRpc = new LightRPC(nodeUrl)
    this.addressMetas = addresses.map(address => AddressMeta.fromObject(address))
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
    const syncScripts = await this.upsertTxHashes()
    await this.updateSyncedBlockOfScripts(syncScripts)
    const minSyncBlockNumber = await SyncProgressService.getCurrentWalletMinSyncedBlockNumber()
    const hasNextBlock = await this.notifyAndSyncNext(minSyncBlockNumber)
    if (!hasNextBlock) {
      await this.updateBlockStartNumber(minSyncBlockNumber)
    }
  }

  private async getTransactions({
    script,
    blockRange,
    scriptType,
  }: {
    script: Script
    blockRange: [HexString, HexString]
    scriptType: ScriptType
  }) {
    const res = []
    let lastCursor: HexString | undefined = undefined
    while (lastCursor !== '0x') {
      const result = await this.lightRpc.getTransactions(
        { script, blockRange, scriptType },
        'asc',
        '0x64',
        lastCursor as unknown as HexString
      )
      lastCursor = result.lastCursor
      res.push(...result.txs)
    }
    return res
  }

  protected async upsertTxHashes() {
    const syncScripts = await this.lightRpc.getScripts()
    const syncStatusMap = await SyncProgressService.getAllSyncStatusToMap()
    const insertTxCaches: {
      txHash: string
      txIndex: string
      blockNumber: string
      lockHash: string
      address: string
      walletId: string
    }[] = []
    const isMainnet = NetworksService.getInstance().isMainnet()
    for (let index = 0; index < syncScripts.length; index++) {
      const syncScript = syncScripts[index]
      const scriptHash = scriptToHash(syncScript.script)
      const syncStatus = syncStatusMap.get(scriptHash)
      if (syncStatus) {
        const txs = await this.getTransactions({
          script: syncScript.script,
          scriptType: syncScript.scriptType,
          blockRange: [BI.from(syncStatus.syncedBlockNumber).toHexString(), syncScript.blockNumber],
        })
        insertTxCaches.push(
          ...txs.map(v => ({
            ...v,
            lockHash: scriptHash,
            address: scriptToAddress(syncScript.script, isMainnet),
            walletId: syncStatus.walletId,
          }))
        )
      }
    }
    // save txs to indexer cache
    await IndexerCacheService.upsertIndexerCache(insertTxCaches)
    return syncScripts
  }

  private async updateSyncedBlockOfScripts(syncScripts: LightScriptFilter[]) {
    if (!syncScripts.length) {
      return
    }
    const syncStatusMap = await SyncProgressService.getAllSyncStatusToMap()
    const updatedSyncProgress: SyncProgress[] = []
    syncScripts.forEach(v => {
      const currentSyncProgress = syncStatusMap.get(scriptToHash(v.script))
      if (currentSyncProgress) {
        currentSyncProgress.syncedBlockNumber = parseInt(v.blockNumber)
        updatedSyncProgress.push(currentSyncProgress)
      }
    })
    await getConnection('light').manager.save(updatedSyncProgress, { chunk: 100 })
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
    const walletMinBlockNumber = await SyncProgressService.getWalletMinLocalSavedBlockNumber()
    const wallets = await WalletService.getInstance().getAll()
    const walletStartBlockMap = wallets.reduce<Record<string, string | undefined>>(
      (pre, cur) => ({ ...pre, [cur.id]: cur.startBlockNumber }),
      {}
    )
    const otherTypeSyncBlockNumber = await SyncProgressService.getOtherTypeSyncBlockNumber()
    const addScripts = [
      ...allScripts
        .filter(v => !existSyncscripts[scriptToHash(v.script)])
        .map(v => {
          const blockNumber = Math.max(
            parseInt(walletStartBlockMap[v.walletId] ?? '0x0'),
            walletMinBlockNumber?.[v.walletId] ?? 0
          )
          return {
            ...v,
            blockNumber: `0x${blockNumber.toString(16)}`,
          }
        }),
      ...appendScripts
        .filter(v => !existSyncscripts[scriptToHash(v.script)])
        .map(v => ({
          ...v,
          blockNumber: `0x${(otherTypeSyncBlockNumber[scriptToHash(v.script)] ?? 0).toString(16)}`,
        })),
    ]
    await this.lightRpc.setScripts(addScripts, 'partial')
    const allScriptHashes = new Set([
      ...allScripts.map(v => scriptToHash(v.script)),
      ...appendScripts.map(v => scriptToHash(v.script)),
    ])
    const deleteScript = syncScripts.filter(v => !allScriptHashes.has(scriptToHash(v.script)))
    await this.lightRpc.setScripts(deleteScript, 'delete')
    const walletIds = [...new Set(this.addressMetas.map(v => v.walletId))]
    await SyncProgressService.initSyncProgress(addScripts)
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
    if (!previousTxHashes.size) return
    await this.lightRpc.createBatchRequest([...previousTxHashes].map(v => ['fetchTransaction' as keyof Base, v])).exec()
  }

  private async updateBlockStartNumber(blockNumber: number) {
    if (this._needGenerateAddress || !this.pollingIndexer) {
      logger.info('LightConnector:\twait for generating address')
      return
    }
    const scripts = await this.lightRpc.getScripts()
    await SyncProgressService.updateBlockNumber(
      scripts.map(v => v.script.args),
      blockNumber
    )
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

  async appendScript(scripts: AppendScript[]) {
    this.initSyncProgress(scripts)
  }

  private async checkTxExist(txHashes: string[]) {
    const transactions = await this.lightRpc
      .createBatchRequest<'getTransaction', string[], TransactionWithStatus[]>(txHashes.map(v => ['getTransaction', v]))
      .exec()
    return transactions.every(v => !!v.transaction)
  }

  async processTxsInNextBlockNumber() {
    const [nextBlockNumber, txHashesInNextBlock] = await this.getTxHashesWithNextUnprocessedBlockNumber()
    const minSyncBlockNumber = await SyncProgressService.getCurrentWalletMinSyncedBlockNumber()
    if (
      nextBlockNumber !== undefined &&
      txHashesInNextBlock.length &&
      // For light client, if tx hash has been called with fetch_transaction, the tx can not return by get_transactions
      // So before derived address synced to bigger than next synced block number, do not sync the next block number
      minSyncBlockNumber >= parseInt(nextBlockNumber) &&
      // check whether the tx is sync from light client, after split the light client and full DB file, this check will remove
      (await this.checkTxExist(txHashesInNextBlock))
    ) {
      this.processingBlockNumber = nextBlockNumber
      await this.fetchPreviousOutputs(txHashesInNextBlock)
      this.transactionsSubject.next({ txHashes: txHashesInNextBlock, params: this.processingBlockNumber })
    }
  }

  public async notifyCurrentBlockNumberProcessed(blockNumber: string) {
    if (blockNumber === this.processingBlockNumber) {
      this.processingBlockNumber = undefined
    } else {
      return
    }
    const minCachedBlockNumber = await SyncProgressService.getCurrentWalletMinSyncedBlockNumber()
    await this.updateBlockStartNumber(Math.min(parseInt(blockNumber), minCachedBlockNumber))
    this.processNextBlockNumber()
  }
}
