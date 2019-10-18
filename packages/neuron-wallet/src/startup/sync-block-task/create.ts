import { BrowserWindow } from 'electron'
import { ReplaySubject } from 'rxjs'
import path from 'path'
import { networkSwitchSubject } from 'services/networks'
import { NetworkWithID } from 'types/network'
import env from 'env'
import AddressService from 'services/addresses'
import genesisBlockHash from './genesis'
import InitDatabase from './init-database'

export { genesisBlockHash }

const updateAllAddressesTxCount = async (url: string) => {
  const addresses = (await AddressService.allAddresses()).map(addr => addr.address)
  await AddressService.updateTxCountAndBalances(addresses, url)
}

export interface DatabaseInitParams {
  network: NetworkWithID
  genesisBlockHash: string
  chain: string
}

export const databaseInitSubject = new ReplaySubject<DatabaseInitParams>(1)

networkSwitchSubject.subscribe(async (network: NetworkWithID | undefined) => {
  if (network) {
    // TODO: only switch if genesisHash is different

    await InitDatabase.getInstance().stopAndWait()
    const info = await InitDatabase.getInstance().init(network.remote)

    if (info !== 'killed') {
      const databaseInitParams: DatabaseInitParams = {
        network,
        genesisBlockHash: info.hash,
        chain: info.chain
      }
      databaseInitSubject.next(databaseInitParams)
      // re init txCount in addresses if switch network
      await updateAllAddressesTxCount(network.remote)
    }
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
