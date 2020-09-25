import EventEmiter from 'events'
import SyncedBlockNumber from 'models/synced-block-number'
import SyncStateSubject from 'models/subjects/sync-state-subject'
import NodeService from 'services/node'
import Method from '@nervosnetwork/ckb-sdk-rpc/lib/method'

interface SyncState {
  nodeUrl: string,
  timestamp: number,
  indexerTipNumber: number,
  cacheTipNumber: number,
  bestKnownBlockNumber: number,
  indexRate: number | undefined,
  cacheRate: number | undefined,
  estimate: number | undefined,
  synced: boolean,
}

export default class SyncApiController {
  #syncedBlockNumber = new SyncedBlockNumber()
  static emiter = new EventEmiter()

  private estimates: Array<SyncState> = []
  private sampleTime: number = 60000
  private minimumSteps = 50
  private nodeUrl: string | undefined

  public async mount() {
    this.registerHandlers()
  }

  private getEstimatesByCurrentNode () {
    return this.estimates.filter(
      state => state.nodeUrl === this.nodeUrl
    )
  }

  private calculateAvgIndexRate (currentindexerTipNumber: number, timestamp: number) {
    const firstState = this.getEstimatesByCurrentNode()[0]
    if (!firstState) {
      return undefined
    }
    const advancedindexerTipNumber = currentindexerTipNumber - firstState.indexerTipNumber
    if (advancedindexerTipNumber < this.minimumSteps) {
      return undefined
    }
    const lastedTime = timestamp - firstState.timestamp
    const indexRate = advancedindexerTipNumber / lastedTime
    return indexRate
  }

  private updateEstimates (newSyncEstimate: SyncState) {
    const currentTime = Date.now()
    this.estimates = this.getEstimatesByCurrentNode().filter(
      state => currentTime - state.timestamp <= this.sampleTime
    )
    this.estimates.push(newSyncEstimate)

    return newSyncEstimate
  }

  private async fetchBestKnownBlockNumber (): Promise<number> {
    const method = new Method({url: this.nodeUrl!}, {
      name: 'sync state',
      method: 'sync_state',
      paramsFormatters: [],
    })
    const {best_known_block_number} = await method.call()
    return parseInt(best_known_block_number, 16)
  }

  private async estimate (states: any): Promise<SyncState> {
    const indexerTipNumber = parseInt(states.indexerTipNumber)
    const cacheTipNumber = parseInt(states.cacheTipNumber)
    const timestamp = parseInt(states.timestamp)

    const ckb = NodeService.getInstance().ckb
    this.nodeUrl = ckb.node.url

    const bestKnownBlockNumber = await this.fetchBestKnownBlockNumber()

    const remainingBlocksToCache = bestKnownBlockNumber - cacheTipNumber
    const remainingBlocksToIndex = bestKnownBlockNumber - indexerTipNumber
    const synced = remainingBlocksToCache < 5

    const newSyncEstimate: SyncState = {
      nodeUrl: this.nodeUrl,
      timestamp,
      indexerTipNumber,
      cacheTipNumber,
      bestKnownBlockNumber,
      indexRate: undefined,
      cacheRate: undefined,
      estimate: undefined,
      synced,
    }

    const indexRate = this.calculateAvgIndexRate(indexerTipNumber, timestamp)
    if (!synced && indexRate) {
      const estimate = remainingBlocksToIndex / indexRate
      Object.assign(newSyncEstimate, {
        indexRate,
        estimate,
      })
    }

    return this.updateEstimates(newSyncEstimate)
  }

  private registerHandlers() {
    SyncApiController.emiter.on('sync-estimate-updated', async states => {
      const newSyncEstimate = await this.estimate(states)
      this.#syncedBlockNumber.setNextBlock(BigInt(newSyncEstimate.cacheTipNumber))
      SyncStateSubject.next(newSyncEstimate)
    })
  }
}
