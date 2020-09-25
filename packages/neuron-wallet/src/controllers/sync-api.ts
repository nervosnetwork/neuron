import EventEmiter from 'events'
import SyncedBlockNumber from 'models/synced-block-number'
import SyncStateSubject from 'models/subjects/sync-state-subject'
import NodeService from 'services/node'
import Method from '@nervosnetwork/ckb-sdk-rpc/lib/method'

interface SyncState {
  nodeUrl: string,
  timestamp: number,
  indexerTip: number,
  cacheTip: number,
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

  private calculateAvgIndexRate (currentIndexerTip: number, timestamp: number) {
    const firstState = this.getEstimatesByCurrentNode()[0]
    if (!firstState) {
      return undefined
    }
    const advancedIndexerTip = currentIndexerTip - firstState.indexerTip
    if (advancedIndexerTip < this.minimumSteps) {
      return undefined
    }
    const lastedTime = timestamp - firstState.timestamp
    const indexRate = advancedIndexerTip / lastedTime
    return indexRate
  }

  private updateEstimates (newState: SyncState) {
    const currentTime = Date.now()
    this.estimates = this.getEstimatesByCurrentNode().filter(
      state => currentTime - state.timestamp <= this.sampleTime
    )
    this.estimates.push(newState)

    return newState
  }

  private async fetchBestKnownBlockNumber (): Promise<number> {
    const PROPERTIES = {
      name: 'sync state',
      method: 'sync_state',
      paramsFormatters: [],
    }

    const method = new Method({url: this.nodeUrl!}, PROPERTIES)
    const {best_known_block_number} = await method.call()
    return parseInt(best_known_block_number, 16)
  }

  private async estimate (states: any): Promise<SyncState> {
    const indexerTip = parseInt(states.indexerTip)
    const cacheTip = parseInt(states.cacheTip)
    const timestamp = parseInt(states.timestamp)

    const ckb = NodeService.getInstance().ckb
    this.nodeUrl = ckb.node.url

    const bestKnownBlockNumber = await this.fetchBestKnownBlockNumber()

    const estimatesByNode = this.getEstimatesByCurrentNode()
    const lastSyncState = estimatesByNode[estimatesByNode.length - 1]

    const remainingBlocksToCache = bestKnownBlockNumber - cacheTip
    const remainingBlocksToIndex = bestKnownBlockNumber - indexerTip
    const synced = remainingBlocksToCache < 5

    let newState: SyncState

    if (!lastSyncState || synced) {
      newState = {
        nodeUrl: this.nodeUrl,
        timestamp,
        indexerTip,
        cacheTip,
        bestKnownBlockNumber,
        indexRate: undefined,
        cacheRate: undefined,
        estimate: undefined,
        synced,
      }
    }
    else {
      let estimate = undefined

      const indexRate = this.calculateAvgIndexRate(indexerTip, timestamp)

      if (indexRate) {
        estimate = remainingBlocksToIndex / indexRate
      }

      newState = {
        nodeUrl: this.nodeUrl,
        timestamp,
        indexerTip,
        cacheTip,
        bestKnownBlockNumber,
        indexRate,
        cacheRate: undefined,
        estimate,
        synced,
      }
    }

    return this.updateEstimates(newState)
  }

  private registerHandlers() {
    SyncApiController.emiter.on('synced-block-number-updated', async blockNumber => {
      this.#syncedBlockNumber.setNextBlock(BigInt(blockNumber))
    })
    SyncApiController.emiter.on('sync-states-updated', async states => {
      const newState = await this.estimate(states)
      SyncStateSubject.next(newState)
    })
  }
}
