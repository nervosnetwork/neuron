import { BrowserWindow } from 'electron'
import path from 'path'
import { distinctUntilChanged } from 'rxjs/operators'
import { NetworkWithID, EMPTY_GENESIS_HASH } from 'types/network'
import Address from 'database/address/address-dao'
import DataUpdateSubject from 'models/subjects/data-update'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletCreatedSubject from 'models/subjects/wallet-created-subject'
import { SyncedBlockNumberSubject } from 'models/subjects/node'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import NodeService from 'services/node'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import BlockNumber from 'block-sync-renderer/sync/block-number'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'

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
    network = NetworksService.getInstance().getCurrent()
  }

  // TODO: Do not clean meta info here!!!
  LockUtils.cleanInfo()
  DaoUtils.cleanInfo()

  const blockNumber = await (new BlockNumber()).getCurrent()
  SyncedBlockNumberSubject.next(blockNumber.toString())
  DataUpdateSubject.next({
    dataType: 'transaction',
    actionType: 'update',
  })

  if (network.genesisHash !== EMPTY_GENESIS_HASH) {
    if (backgroundWindow) {
      const lockHashes = await AddressService.allLockHashes(network.remote)
      backgroundWindow.webContents.send("block-sync:start", network.remote, network.genesisHash, lockHashes)
    }
    // re init txCount in addresses if switch network
    await updateAllAddressesTxCount(network.remote)
  }
}

NodeService
  .getInstance()
  .connectionStatusSubject
  .pipe(distinctUntilChanged())
  .subscribe(async (connected: boolean) => {
    if (connected) {
      logger.debug('Network reconnected')
      network = NetworksService.getInstance().getCurrent()
      switchToNetwork(network, true)
    } else {
      logger.debug('Network connection dropped')
    }
  })

const restartBlockSyncTask = async () => {
  killBlockSyncTask()
  await createBlockSyncTask()
}

export const switchToNetwork = async (newNetwork: NetworkWithID, reconnected = false) => {
  const previousNetwork = network
  network = newNetwork

  if (previousNetwork && !reconnected) {
    if (previousNetwork.id === newNetwork.id || previousNetwork.genesisHash === newNetwork.genesisHash) {
      // Three's no actual change. No need to reconnect.
      return
    }
  }

  if (reconnected) {
    logger.debug('Network reconnected to:', network)
  } else {
    logger.debug('Network switched to:', network)
  }

  await restartBlockSyncTask()
}

export const createBlockSyncTask = async () => {
  await CommonUtils.sleep(2000) // Do not start too fast

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

export const killBlockSyncTask = () => {
  if (backgroundWindow) {
    logger.info('Kill block sync background process')
    backgroundWindow.close()
  }
}
