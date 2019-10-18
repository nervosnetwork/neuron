import { BrowserWindow } from 'electron'

export default class MainWindowController {
  public static mainWindow: BrowserWindow | null
  public static systemScriptUpdated = (systemScript: { codeHash: string }) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('system-script-updated', systemScript)
    }
  }

  public static dataUpdated = (meta: {
    dataType: 'current-wallet' | 'wallets' | 'address' | 'transaction' | 'network'
  }) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('data-updated', meta)
    }
  }

  public static currentNetworkIDUpdated = (networkID: string) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('current-network-id-updated', networkID)
    }
  }

  public static networkListUpdated = (networkList: any) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('network-list-updated', networkList)
    }
  }

  public static connectionStatusUpdated = (connectionStatus: boolean) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('connection-status-updated', connectionStatus)
    }
  }

  public static syncedBlockNumberUpdated = (blockNumber: string) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('synced-block-number-updated', blockNumber)
    }
  }

  public static sendCommand = (command: {
    winID: number
    type: 'nav' | 'toggle-address-book' | 'delete-wallet' | 'backup-wallet'
    payload: string | null
  }) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send('command', command)
    }
  }
}
