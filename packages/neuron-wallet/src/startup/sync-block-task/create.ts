import { BrowserWindow } from 'electron'
import { ReplaySubject } from 'rxjs'
import path from 'path'
import { NetworkWithID } from 'types/network'
import env from 'env'
import AddressService from 'services/addresses'
import genesisBlockHash from './genesis'
import InitDatabase from './init-database'
import DataUpdateSubject from 'models/subjects/data-update'
import logger from 'utils/logger'
import NodeService from 'services/node'
import NetworksService from 'services/networks'
import { distinctUntilChanged, pairwise, startWith } from 'rxjs/operators'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import NetworkSwitchSubject from 'models/subjects/network-switch-subject'
import { SyncedBlockNumberSubject } from 'models/subjects/node'
import BlockNumber from 'services/sync/block-number'

export { genesisBlockHash }

const updateAllAddressesTxCount = async (url: string) => {
  const addresses = AddressService.allAddresses().map(addr => addr.address)
  await AddressService.updateTxCountAndBalances(addresses, url)
}

export interface DatabaseInitParams {
  network: NetworkWithID
  genesisBlockHash: string
  chain: string
}

// network switch or network connect
const networkChange = async (network: NetworkWithID) => {
  await InitDatabase.getInstance().stopAndWait()
  // clean LockUtils info and DaoUtils info
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()
  const info = await InitDatabase.getInstance().init(network)

  const blockNumber = await (new BlockNumber()).getCurrent()
  SyncedBlockNumberSubject.next(blockNumber.toString())
  DataUpdateSubject.next({
    dataType: 'transaction',
    actionType: 'update',
  })

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

export const databaseInitSubject = new ReplaySubject<DatabaseInitParams>(1)

NetworkSwitchSubject
  .getSubject()
  .pipe(
    startWith(undefined),
    pairwise()
  )
  .subscribe(async ([previousNetwork, network]: (NetworkWithID | undefined)[]) => {
    if ((!previousNetwork && network) || (previousNetwork && network && network.id !== previousNetwork.id)) {
      await networkChange(network)
    }
  })

NodeService
  .getInstance()
  .connectionStatusSubject
  .pipe(distinctUntilChanged())
  .subscribe(async (status: boolean) => {
    if (status && InitDatabase.getInstance().isUsingPrevious()) {
      const network = NetworksService.getInstance().getCurrent()
      logger.debug('networkConnect:', network)
      if (network) {
        await networkChange(network)
      }
    }
  })

const loadURL = `file://${path.join(__dirname, 'index.html')}`

let syncBlockBackgroundWindow: BrowserWindow | null

// create a background task to sync transactions
// this task is a renderer process
export const createSyncBlockTask = () => {
  if (syncBlockBackgroundWindow) {
    return
  }

  logger.info('Start sync block background process')
  syncBlockBackgroundWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  })

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

  syncBlockBackgroundWindow.loadURL(loadURL)

  return syncBlockBackgroundWindow
}

export const killSyncBlockTask = () => {
  if (syncBlockBackgroundWindow) {
    logger.info('Kill sync block background process')
    // TODO: kill block number listener
    // FIXME: this cuases crash when closing the window but not quit the app
    syncBlockBackgroundWindow.close()
    syncBlockBackgroundWindow = null
  }
}
