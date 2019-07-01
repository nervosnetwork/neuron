import { BrowserWindow } from 'electron'
import { ReplaySubject } from 'rxjs'
import path from 'path'
import { networkSwitchSubject, NetworkWithID } from '../../services/networks'
import env from '../../env'
import genesisBlockHash from './genesis'
import CellsService from '../../services/cells'
import LockUtils from '../../models/lock-utils'
import AddressService from '../../services/addresses'
import initDatabase from './init-database'

export { genesisBlockHash }

const updateAllAddressesTxCount = async () => {
  const blake160s: string[] = await CellsService.allBlake160s()
  const addresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
  await AddressService.updateTxCountAndBalances(addresses)
}

export const databaseInitSubject = new ReplaySubject(1)
networkSwitchSubject.subscribe(async (network: NetworkWithID | undefined) => {
  if (network) {
    // TODO: only switch if genesisHash is different
    await initDatabase()
    databaseInitSubject.next(network)
    // re init txCount in addresses if switch network
    await updateAllAddressesTxCount()
  }
})

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
