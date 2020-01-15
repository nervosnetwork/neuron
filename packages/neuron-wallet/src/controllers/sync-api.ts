import { ipcMain, IpcMainInvokeEvent } from 'electron'
import SyncedBlockNumber from 'models/synced-block-number'

// Handle channel messages from sync renderer process
export default class SyncApiController {

  public async mount() {
    this.registerHandlers()
  }

  private registerHandlers() {
    this.handle('synced-block-number-updated', async (_, blockNumber) => {
      new SyncedBlockNumber().setNextBlock(BigInt(blockNumber))
    })
  }

  private handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<void>) {
    ipcMain.handle(channel, async (event, args) => {
      await listener(event, args)
    })
  }
}
