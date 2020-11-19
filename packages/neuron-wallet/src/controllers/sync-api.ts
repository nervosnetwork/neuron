import EventEmiter from 'events'
import RpcService from 'services/rpc-service'
import SyncedBlockNumber from 'models/synced-block-number'
import SyncStateSubject from 'models/subjects/sync-state-subject'
import NodeService from 'services/node'
import Method from '@nervosnetwork/ckb-sdk-rpc/lib/method'
import { CurrentNetworkIDSubject } from 'models/subjects/networks'
import { debounceTime } from 'rxjs/operators'

const MAX_TIP_BLOCK_DELAY = 180000
const TEN_MINS = 600000

export enum SyncStatus {
  SyncNotStart,
  SyncPending,
  Syncing,
  SyncCompleted,
}

interface SyncState {
  nodeUrl: string,
  timestamp: number,
  indexerTipNumber: number,
  cacheTipNumber: number,
  bestKnownBlockNumber: number,
  bestKnownBlockTimestamp: number,
  indexRate: number | undefined,
  cacheRate: number | undefined,
  estimate: number | undefined,
  status: SyncStatus
}

export default class SyncApiController {
  #syncedBlockNumber = new SyncedBlockNumber()
  static emiter = new EventEmiter()
  private static instance: SyncApiController

  private estimates: Array<SyncState> = []
  private sampleTime: number = 60000
  private indexerTipDiff = 50
  private cacheDiff = 5
  private bestKnownBlockNumberDiff = 50
  private cachedEstimation: SyncState|undefined = undefined

  public static getInstance() {
    if (this.instance) {
      return this.instance
    }
    this.instance = new SyncApiController()
    return this.instance
  }

  public async mount() {
    this.registerHandlers()
  }

  private getEstimatesByCurrentNode () {
    const nodeUrl = this.getCurrentNodeUrl()
    return this.estimates.filter(
      state => state.nodeUrl === nodeUrl &&
      Date.now() - state.timestamp <= this.sampleTime
    )
  }

  private calculateAvgIndexRate (currentindexerTipNumber: number, timestamp: number) {
    const firstState = this.getEstimatesByCurrentNode()[0]
    if (!firstState) {
      return undefined
    }
    const advancedindexerTipNumber = currentindexerTipNumber - firstState.indexerTipNumber
    if (advancedindexerTipNumber < this.indexerTipDiff) {
      return undefined
    }
    const lastedTime = timestamp - firstState.timestamp
    const indexRate = advancedindexerTipNumber / lastedTime
    return indexRate
  }

  private foundBestKnownBlockNumber (bestKnownBlockNumber: number): boolean {
    const estimates = this.getEstimatesByCurrentNode()
    const lastEstimate = estimates[0]

    if (!lastEstimate) {
      return false
    }

    if (bestKnownBlockNumber - lastEstimate.bestKnownBlockNumber >= this.bestKnownBlockNumberDiff) {
      return false
    }

    return true
  }

  private updateEstimates (newSyncEstimate: SyncState) {
    const currentTime = Date.now()
    this.estimates = this.getEstimatesByCurrentNode().filter(
      state => currentTime - state.timestamp <= this.sampleTime
    )
    this.estimates.push(newSyncEstimate)

    return newSyncEstimate
  }

  private async fetchBestKnownBlockInfo (): Promise<{ bestKnownBlockNumber: number, bestKnownBlockTimestamp: number }> {
    const nodeUrl = this.getCurrentNodeUrl()
    try {
      const method = new Method({url: nodeUrl}, {
        name: 'sync state',
        method: 'sync_state',
        paramsFormatters: [],
      })
      const { best_known_block_number, best_known_block_timestamp } = await method.call()
      return {
        bestKnownBlockNumber: parseInt(best_known_block_number, 16),
        bestKnownBlockTimestamp: +best_known_block_timestamp,
      }
    } catch (error) {
      const tipHeader = await new RpcService(nodeUrl).getTipHeader()

      return {
        bestKnownBlockNumber: Number(tipHeader.number),
        bestKnownBlockTimestamp: Number(tipHeader.timestamp),
      }
    }
  }

  private getCurrentNodeUrl () {
    const ckb = NodeService.getInstance().ckb
    return ckb.node.url
  }

  private async estimate (states: any): Promise<SyncState> {
    const indexerTipNumber = parseInt(states.indexerTipNumber)
    const cacheTipNumber = parseInt(states.cacheTipNumber)

    const currentTimestamp = Date.now()
    const nodeUrl = this.getCurrentNodeUrl()
    const tipHeader = await new RpcService(nodeUrl).getTipHeader()

    const { bestKnownBlockNumber, bestKnownBlockTimestamp } = await this.fetchBestKnownBlockInfo()
    const foundBestKnownBlockNumber = this.foundBestKnownBlockNumber(bestKnownBlockNumber)

    const remainingBlocksToCache = bestKnownBlockNumber - cacheTipNumber
    const remainingBlocksToIndex = bestKnownBlockNumber - indexerTipNumber

    const newSyncEstimate: SyncState = {
      nodeUrl,
      timestamp: currentTimestamp,
      indexerTipNumber,
      cacheTipNumber,
      bestKnownBlockNumber,
      bestKnownBlockTimestamp,
      indexRate: undefined,
      cacheRate: undefined,
      estimate: undefined,
      status: SyncStatus.Syncing
    }

    if (foundBestKnownBlockNumber) {
      const allCached = remainingBlocksToCache < this.cacheDiff

      const tipBlockTimestamp = Number(tipHeader.timestamp)
      if (allCached) {
        if (tipBlockTimestamp + MAX_TIP_BLOCK_DELAY >= newSyncEstimate.timestamp) {
          newSyncEstimate.status = SyncStatus.SyncCompleted
        }
        if (tipBlockTimestamp + TEN_MINS < newSyncEstimate.timestamp) {
          newSyncEstimate.status = SyncStatus.SyncPending
        }
      }

      const indexRate = this.calculateAvgIndexRate(indexerTipNumber, currentTimestamp)
      if (!allCached && indexRate) {
        const estimate = Math.round(remainingBlocksToIndex / indexRate)
        Object.assign(newSyncEstimate, {
          indexRate,
          estimate,
        })
      }
    }

    return this.updateEstimates(newSyncEstimate)
  }

  public async getSyncStatus () {
    if (!this.estimates.length) {
      return SyncStatus.SyncNotStart
    }
    const lastEstimate = this.estimates[this.estimates.length - 1]
    return lastEstimate.status
  }

  public getCachedEstimation () {
    const lastEstimation = this.estimates[this.estimates.length - 1]
    if (!this.cachedEstimation) {
      this.cachedEstimation = lastEstimation
      return this.cachedEstimation
    }

    if (this.estimates.length > 1 &&
      this.estimates[this.estimates.length - 2].cacheTipNumber === lastEstimation.cacheTipNumber
    ) {
      this.cachedEstimation = lastEstimation
      return this.cachedEstimation
    }

    const nodeUrl = this.getCurrentNodeUrl()

    if (this.cachedEstimation.nodeUrl !== nodeUrl ||
      this.cachedEstimation.timestamp + this.sampleTime <= Date.now()
    ) {
      this.cachedEstimation = lastEstimation
    }

    return this.cachedEstimation
  }

  private registerHandlers() {
    SyncApiController.emiter.on('cache-tip-block-updated', async states => {
      const newSyncEstimate = await this.estimate(states)
      this.#syncedBlockNumber.setNextBlock(BigInt(newSyncEstimate.cacheTipNumber))
      SyncStateSubject.next(newSyncEstimate)
    })

    CurrentNetworkIDSubject.pipe(debounceTime(500)).subscribe(() => {
      const nodeUrl = this.getCurrentNodeUrl()
      const newSyncEstimate: SyncState = {
        nodeUrl,
        timestamp: 0,
        indexerTipNumber: 0,
        cacheTipNumber: 0,
        bestKnownBlockNumber: 0,
        bestKnownBlockTimestamp: 0,
        indexRate: undefined,
        cacheRate: undefined,
        estimate: undefined,
        status: SyncStatus.SyncNotStart
      }
      this.estimates = [newSyncEstimate]

      SyncStateSubject.next(newSyncEstimate)
    })
  }
}
