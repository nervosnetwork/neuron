import EventEmiter from 'events'
import { debounceTime } from 'rxjs/operators'
import NodeService from '../services/node'
import RpcService from '../services/rpc-service'
import SyncedBlockNumber from '../models/synced-block-number'
import SyncStateSubject from '../models/subjects/sync-state-subject'
import { CurrentNetworkIDSubject } from '../models/subjects/networks'
import MultisigService from '../services/multisig'
import { getLookingValidTargetStatus } from '../services/ckb-runner'

const TEN_MINS = 600000
const MAX_TIP_BLOCK_DELAY = 180000

export enum SyncStatus {
  SyncNotStart,
  SyncPending,
  Syncing,
  SyncCompleted,
}

interface SyncState {
  nodeUrl: string
  timestamp: number
  indexerTipNumber: number
  cacheTipNumber: number
  bestKnownBlockNumber: number
  bestKnownBlockTimestamp: number
  indexRate: number | undefined
  cacheRate: number | undefined
  estimate: number | undefined
  status: SyncStatus
  isLookingValidTarget?: boolean
  validTarget?: string
}

export default class SyncApiController {
  #syncedBlockNumber = new SyncedBlockNumber()
  static emiter = new EventEmiter()
  private static instance: SyncApiController

  #estimates: Array<SyncState> = []
  #sampleTime: number = 60000
  #indexerTipDiff = 50
  #cacheDiff = 5
  #bestKnownBlockNumberDiff = 50
  #cachedEstimation?: SyncState = undefined

  public static getInstance() {
    if (this.instance) {
      return this.instance
    }
    this.instance = new SyncApiController()
    return this.instance
  }

  public mount() {
    this.#registerHandlers()
  }

  #getEstimatesByCurrentNode = () => {
    const nodeUrl = NodeService.getInstance().nodeUrl
    return this.#estimates.filter(
      state => state.nodeUrl === nodeUrl && Date.now() - state.timestamp <= this.#sampleTime
    )
  }

  #calculateAvgIndexRate = (currentindexerTipNumber: number, timestamp: number) => {
    const firstState = this.#getEstimatesByCurrentNode()[0]
    if (!firstState) {
      return undefined
    }
    const advancedindexerTipNumber = currentindexerTipNumber - firstState.indexerTipNumber
    if (advancedindexerTipNumber < this.#indexerTipDiff) {
      return undefined
    }
    const lastedTime = timestamp - firstState.timestamp
    const indexRate = advancedindexerTipNumber / lastedTime
    return indexRate
  }

  #foundBestKnownBlockNumber = (bestKnownBlockNumber: number): boolean => {
    const estimates = this.#getEstimatesByCurrentNode()
    const lastEstimate = estimates[0]

    if (!lastEstimate) {
      return false
    }

    if (bestKnownBlockNumber - lastEstimate.bestKnownBlockNumber >= this.#bestKnownBlockNumberDiff) {
      return false
    }

    return true
  }

  #updateEstimates = (newSyncState: SyncState) => {
    const currentTime = Date.now()
    this.#estimates = this.#getEstimatesByCurrentNode().filter(
      state => currentTime - state.timestamp <= this.#sampleTime
    )
    this.#estimates.push(newSyncState)

    return newSyncState
  }

  #fetchBestKnownBlockInfo = async (): Promise<{ bestKnownBlockNumber: number; bestKnownBlockTimestamp: number }> => {
    const nodeUrl = NodeService.getInstance().nodeUrl
    const rpcService = new RpcService(nodeUrl)
    try {
      const syncState = await rpcService.getSyncState()
      return {
        bestKnownBlockNumber: parseInt(syncState.bestKnownBlockNumber, 16),
        bestKnownBlockTimestamp: +syncState.bestKnownBlockTimestamp,
      }
    } catch (error) {
      const tipHeader = await rpcService.getTipHeader()

      return {
        bestKnownBlockNumber: Number(tipHeader.number),
        bestKnownBlockTimestamp: Number(tipHeader.timestamp),
      }
    }
  }

  #estimate = async (states: any): Promise<SyncState> => {
    const indexerTipNumber = parseInt(states.indexerTipNumber)
    const cacheTipNumber = parseInt(states.cacheTipNumber)

    const currentTimestamp = Date.now()
    const nodeUrl = NodeService.getInstance().nodeUrl
    const tipHeader = await new RpcService(nodeUrl).getTipHeader()

    const { bestKnownBlockNumber, bestKnownBlockTimestamp } = await this.#fetchBestKnownBlockInfo()
    const foundBestKnownBlockNumber = this.#foundBestKnownBlockNumber(bestKnownBlockNumber)

    const remainingBlocksToCache = bestKnownBlockNumber - cacheTipNumber
    const remainingBlocksToIndex = bestKnownBlockNumber - indexerTipNumber

    const newSyncState: SyncState = {
      nodeUrl,
      timestamp: currentTimestamp,
      indexerTipNumber,
      cacheTipNumber,
      bestKnownBlockNumber,
      bestKnownBlockTimestamp,
      indexRate: undefined,
      cacheRate: undefined,
      estimate: undefined,
      status: SyncStatus.Syncing,
      isLookingValidTarget: getLookingValidTargetStatus(),
      validTarget: process.env.CKB_NODE_ASSUME_VALID_TARGET,
    }

    if (foundBestKnownBlockNumber) {
      const allCached = remainingBlocksToCache < this.#cacheDiff

      const tipBlockTimestamp = Number(tipHeader.timestamp)
      if (allCached) {
        if (tipBlockTimestamp + MAX_TIP_BLOCK_DELAY >= newSyncState.timestamp) {
          newSyncState.status = SyncStatus.SyncCompleted
        }
        if (tipBlockTimestamp + TEN_MINS < newSyncState.timestamp) {
          newSyncState.status = SyncStatus.SyncPending
        }
      }

      const indexRate = this.#calculateAvgIndexRate(indexerTipNumber, currentTimestamp)
      if (!allCached && indexRate) {
        const estimate = Math.round(remainingBlocksToIndex / indexRate)
        Object.assign(newSyncState, {
          indexRate,
          estimate,
        })
      }
    }

    return this.#updateEstimates(newSyncState)
  }

  public async getSyncStatus() {
    if (!this.#estimates.length) {
      return SyncStatus.SyncNotStart
    }
    const lastEstimate = this.#estimates[this.#estimates.length - 1]
    return lastEstimate.status
  }

  public getCachedEstimation() {
    const lastEstimation = this.#estimates[this.#estimates.length - 1]
    if (!this.#cachedEstimation) {
      this.#cachedEstimation = lastEstimation
      return this.#cachedEstimation
    }

    if (
      this.#estimates.length > 1 &&
      this.#estimates[this.#estimates.length - 2].cacheTipNumber === lastEstimation.cacheTipNumber
    ) {
      this.#cachedEstimation = lastEstimation
      return this.#cachedEstimation
    }

    const nodeUrl = NodeService.getInstance().nodeUrl

    if (
      this.#cachedEstimation.nodeUrl !== nodeUrl ||
      this.#cachedEstimation.timestamp + this.#sampleTime <= Date.now()
    ) {
      this.#cachedEstimation = lastEstimation
    }

    return this.#cachedEstimation
  }

  #registerHandlers = () => {
    // FIX: remove listener when sync task stopped
    // Export handler to devtools
    SyncApiController.emiter.on('cache-tip-block-updated', async states => {
      const newSyncState = await this.#estimate(states)
      this.#syncedBlockNumber.setNextBlock(BigInt(newSyncState.cacheTipNumber))
      SyncStateSubject.next(newSyncState)
      await MultisigService.syncMultisigOutput(`0x${BigInt(newSyncState.cacheTipNumber).toString(16)}`)
    })

    CurrentNetworkIDSubject.pipe(debounceTime(500)).subscribe(() => {
      const nodeUrl = NodeService.getInstance().nodeUrl
      const newSyncState: SyncState = {
        nodeUrl,
        timestamp: 0,
        indexerTipNumber: 0,
        cacheTipNumber: 0,
        bestKnownBlockNumber: 0,
        bestKnownBlockTimestamp: 0,
        indexRate: undefined,
        cacheRate: undefined,
        estimate: undefined,
        status: SyncStatus.SyncNotStart,
        validTarget: process.env.CKB_NODE_ASSUME_VALID_TARGET,
      }
      this.#estimates = [newSyncState]

      SyncStateSubject.next(newSyncState)
    })
  }
}
