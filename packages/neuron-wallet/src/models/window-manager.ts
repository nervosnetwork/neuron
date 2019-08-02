import { BrowserWindow } from 'electron'

export default class WindowManager {
  public static mainWindow: BrowserWindow | null
  public static systemScriptUpdated = (systemScript: { codeHash: string }) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('system-script-updated', systemScript)
    }
  }

  public static dataUpdated = (meta: {
    dataType: 'current-wallet' | 'wallets' | 'address' | 'transaction' | 'network'
  }) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('data-updated', meta)
    }
  }

  public static currentNetworkIDUpdated = (networkID: string) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('current-network-id-updated', networkID)
    }
  }

  public static networkListUpdated = (networkList: any) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('network-list-updated', networkList)
    }
  }

  public static connectionStatusUpdated = (connectionStatus: boolean) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('connection-status-updated', connectionStatus)
    }
  }

  public static syncedBlockNumberUpdated = (blockNumber: string) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('synced-block-number-updated', blockNumber)
    }
  }

  public static sendCommand = (command: {
    winID: number
    type: 'nav' | 'toggle-address-book' | 'delete-wallet' | 'backup-wallet'
    payload: string | null
  }) => {
    if (WindowManager.mainWindow) {
      WindowManager.mainWindow.webContents.send('command', command)
    }
  }
}
