import { BrowserWindow } from 'electron'
import path from 'path'
import { NetworkWithID } from 'types/network'
import InitDatabase from './init-database'
import Address from 'database/address/address-dao'
import DataUpdateSubject from 'models/subjects/data-update'
import NetworkSwitchSubject from 'models/subjects/network-switch-subject'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletCreatedSubject from 'models/subjects/wallet-created-subject'
import { SyncedBlockNumberSubject } from 'models/subjects/node'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import { distinctUntilChanged, pairwise, startWith } from 'rxjs/operators'
import NodeService from 'services/node'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import BlockNumber from 'services/sync/block-number'
import CommonUtils from 'utils/common'
import logger from 'utils/logger'

let backgroundWindow: BrowserWindow | null
let network: NetworkWithID | null

const updateAllAddressesTxCount = async (url: string) => {
  const addresses = AddressService.allAddresses().map(addr => addr.address)
  await AddressService.updateTxCountAndBalances(addresses, url)
}

// listen to address created
AddressCreatedSubject.getSubject().subscribe(async (_addresses: Address[]) => {
  // TODO: rescan from #0
  await restartBlockSyncTask()
})

WalletCreatedSubject.getSubject().subscribe(async (type: string) => {
  if (type === 'import') {
    // TODO: no need to rescan from block #0
  }
  // TODO: rescan from #0
})

// Network switch or network connect
const syncNetwork = async () => {
  if (!network) {
    return
  }

  await InitDatabase.getInstance().stopAndWait()
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
    if (backgroundWindow) {
      const lockHashes = await AddressService.allLockHashes(network.remote)
      backgroundWindow.webContents.send("block-sync:start", network.remote, info.hash, lockHashes)
    }
    // re init txCount in addresses if switch network
    await updateAllAddressesTxCount(network.remote)
  }
}

NetworkSwitchSubject
  .getSubject()
  .pipe(
    startWith(undefined),
    pairwise()
  )
  .subscribe(async ([previousNetwork, newNetwork]: (NetworkWithID | undefined)[]) => {
    if ((!previousNetwork && newNetwork) || (previousNetwork && newNetwork && newNetwork.id !== previousNetwork.id)) {
      network = newNetwork
      logger.debug('Network switched:', network)
      await restartBlockSyncTask()
    }
  })

NodeService
  .getInstance()
  .connectionStatusSubject
  .pipe(distinctUntilChanged())
  .subscribe(async (connected: boolean) => {
    if (connected && InitDatabase.getInstance().isUsingPrevious()) {
      network = NetworksService.getInstance().getCurrent()
      logger.debug('Network connected:', network)
      await restartBlockSyncTask()
    }
  })

const restartBlockSyncTask = async () => {
  await killBlockSyncTask()
  createBlockSyncTask()
}

export const createBlockSyncTask = () => {
  if (backgroundWindow) {
    return
  }

  logger.info('Start block sync background process')
  backgroundWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })

  backgroundWindow.on('ready-to-show', async () => {
    syncNetwork()
  })

  backgroundWindow.on('closed', () => {
    backgroundWindow = null
  })

  backgroundWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)
}

export const killBlockSyncTask = async () => {
  if (backgroundWindow) {
    logger.info('Kill block sync background process')
    backgroundWindow.webContents.send("block-sync:will-close")
    // Give ipcRenderer enough time to receive and handle block-sync:will-close channel
    await CommonUtils.sleep(2000)
    backgroundWindow.close()
  }
}
