import { ipcMain, IpcMainInvokeEvent } from 'electron'
import BlockNumber from 'models/block-number'

// Handle channel messages from sync renderer process
export default class SyncApiController {

  public async mount() {
    this.registerHandlers()
  }

  private registerHandlers() {
    this.handle('synced-block-number-updated', async (_, blockNumber) => {
      new BlockNumber().updateCurrent(BigInt(blockNumber))
    })
  }

  private handle(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<void>) {
    ipcMain.handle(channel, async (event, args) => {
      await listener(event, args)
    })
  }
}
