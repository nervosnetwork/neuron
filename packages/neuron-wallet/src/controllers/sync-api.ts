import { ipcMain, IpcMainInvokeEvent } from 'electron'
import SyncedBlockNumber from 'models/synced-block-number'

type SyncChannel =
  | 'synced-block-number-updated'

// Handle channel messages from sync renderer process
export default class SyncApiController {
  #syncedBlockNumber = new SyncedBlockNumber()

  public async mount() {
    this.registerHandlers()
  }

  private registerHandlers() {
    this.handle('synced-block-number-updated', async (_, blockNumber) => {
      this.#syncedBlockNumber.setNextBlock(BigInt(blockNumber))
    })
  }

  private handle(channel: SyncChannel, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<void>) {
    ipcMain.handle(channel, async (event, args) => {
      await listener(event, args)
    })
  }
}
