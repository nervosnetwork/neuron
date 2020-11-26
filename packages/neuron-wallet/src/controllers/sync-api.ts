import SyncedBlockNumber from 'models/synced-block-number'
import EventEmiter from 'events'
import NetworksService from 'services/networks'
import RpcService from 'services/rpc-service'
import { ConnectionStatus, getLatestConnectionStatus } from 'models/subjects/node'
import SyncController from './sync'

const BUFFER_BLOCK_NUMBER = 10
const MAX_TIP_BLOCK_DELAY = 180000

export enum SyncStatus {
  SyncNotStart,
  SyncPending,
  Syncing,
  SyncCompleted,
}

export default class SyncApiController {
  #syncedBlockNumber = new SyncedBlockNumber()
  static emiter = new EventEmiter()

  private TEN_MINS = 10 * 60 * 1000
  private blockNumber10MinAgo: string = ''
  private timestamp10MinAgo: number | undefined
  private prevUrl: string | undefined

  public async mount() {
    this.registerHandlers()
  }

  private registerHandlers() {
    SyncApiController.emiter.on('synced-block-number-updated', async blockNumber => {
      this.#syncedBlockNumber.setNextBlock(BigInt(blockNumber))
    })
  }

  public async getSyncStatus () {
    const [
      syncedBlockNumber = '0',
      connectionStatus,
    ] = await Promise.all([
      new SyncController().currentBlockNumber()
        .then(res => {
          if (res.status) {
            return res.result.currentBlockNumber
          }
          return '0'
        })
        .catch(() => '0'),
        getLatestConnectionStatus(),
    ])

    const network = NetworksService.getInstance().getCurrent()
    const tipHeader = await new RpcService(network.remote).getTipHeader()
    const tipBlockNumber = tipHeader.number
    const tipBlockTimestamp = Number(tipHeader.timestamp)
    const currentTimestamp = Date.now()
    const url = (connectionStatus as ConnectionStatus).url

    if ((!this.timestamp10MinAgo && tipBlockNumber !== '') || (this.prevUrl && url !== this.prevUrl && tipBlockNumber !== '')) {
      this.timestamp10MinAgo = currentTimestamp
      this.blockNumber10MinAgo = tipBlockNumber
      this.prevUrl = url
    }

    const now = Math.floor(currentTimestamp / 1000) * 1000
    if (BigInt(syncedBlockNumber) < BigInt(0) || tipBlockNumber === '0' || tipBlockNumber === '') {
      return SyncStatus.SyncNotStart
    }

    if (this.timestamp10MinAgo && this.timestamp10MinAgo + this.TEN_MINS < currentTimestamp) {
      if (BigInt(this.blockNumber10MinAgo) >= BigInt(tipBlockNumber)) {
        return SyncStatus.SyncPending
      }
      this.timestamp10MinAgo = currentTimestamp
      this.blockNumber10MinAgo = tipBlockNumber
    }

    if (BigInt(syncedBlockNumber) + BigInt(BUFFER_BLOCK_NUMBER) < BigInt(tipBlockNumber)) {
      return SyncStatus.Syncing
    }
    if (tipBlockTimestamp + MAX_TIP_BLOCK_DELAY >= now) {
      return SyncStatus.SyncCompleted
    }
    return SyncStatus.Syncing
  }
}
