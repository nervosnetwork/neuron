import { BrowserWindow } from 'electron'
import { Subject } from 'rxjs'
import path from 'path'
import { networkSwitchSubject, NetworkWithID } from '../../services/networks'
import env from '../../env'
import initConnection from '../../database/chain/ormconfig'
import genesisBlockHash from './genesis'
import CellsService from '../../services/cells'
import LockUtils from '../../utils/lock-utils'
import AddressService from '../../services/addresses'

export { genesisBlockHash }

const updateAllAddressesTxCount = async () => {
  const blake160s: string[] = await CellsService.allBlake160s()
  const addresses = blake160s.map(blake160 => LockUtils.blake160ToAddress(blake160))
  await AddressService.updateTxCountAndBalances(addresses)
}

networkSwitchSubject.subscribe(async (network: NetworkWithID | undefined) => {
  if (network) {
    // TODO: only switch if genesisHash is different
    const hash = await genesisBlockHash()
    await initConnection(hash)
    // re init txCount in addresses if switch network
    await updateAllAddressesTxCount()
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
