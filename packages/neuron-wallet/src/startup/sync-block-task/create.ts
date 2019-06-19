import { BrowserWindow } from 'electron'
import { Subject } from 'rxjs'
import path from 'path'
import { networkSwitchSubject, NetworkWithID } from '../../services/networks'
import env from '../../env'
import initConnection from '../../typeorm'
import genesisBlockHash from './genesis'

export { genesisBlockHash }

networkSwitchSubject.subscribe(async (network: NetworkWithID | undefined) => {
  if (network) {
    const hash = await genesisBlockHash()
    await initConnection(hash)
  }
})

// TODO: mock as an address subject
export const addressChangeSubject = new Subject()

const loadURL = `file://${path.join(__dirname, 'index.html')}`

export { networkSwitchSubject }

/* eslint global-require: "off" */
// create a background task to sync transactions
// this task is a renderer process
const createSyncBlockTask = () => {
  let syncBlockBackgroundWindow: BrowserWindow | null = new BrowserWindow({
    width: 1366,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  })

  syncBlockBackgroundWindow.loadURL(loadURL)

  syncBlockBackgroundWindow.on('ready-to-show', async () => {
    if (env.isDevMode && process.env.DEV_SYNC_TASK) {
      syncBlockBackgroundWindow!.show()
    } else {
      syncBlockBackgroundWindow!.hide()
    }
  })

  syncBlockBackgroundWindow.on('closed', () => {
    syncBlockBackgroundWindow = null
  })

  return syncBlockBackgroundWindow
}

export default createSyncBlockTask
