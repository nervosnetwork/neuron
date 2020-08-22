import SyncedBlockNumber from 'models/synced-block-number'
import EventEmiter from 'events'

// Handle channel messages with EventEmiter in the main process
// @TODO: EventEmiter should replace with MessagePort in the future Worker Thread refactor
export default class SyncApiController {
  #syncedBlockNumber = new SyncedBlockNumber()
  static emiter = new EventEmiter()

  public async mount() {
    this.registerHandlers()
  }

  private registerHandlers() {
    SyncApiController.emiter.on('synced-block-number-updated', async blockNumber => {
      this.#syncedBlockNumber.setNextBlock(BigInt(blockNumber))
    })
  }
}
