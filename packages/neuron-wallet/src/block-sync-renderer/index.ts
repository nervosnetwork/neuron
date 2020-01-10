import { BrowserWindow } from 'electron'
import path from 'path'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import { Address } from 'database/address/address-dao'
import DataUpdateSubject from 'models/subjects/data-update'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import { SyncedBlockNumberSubject } from 'models/subjects/node'
import LockUtils from 'models/lock-utils'
import DaoUtils from 'models/dao-utils'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import BlockNumber from 'block-sync-renderer/sync/block-number'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'
import NodeService from 'services/node'
import RpcService from 'services/rpc-service'

let backgroundWindow: BrowserWindow | null
let network: Network | null

const updateAllAddressesTxCount = async (url: string) => {
  const addresses = AddressService.allAddresses().map(addr => addr.address)
  await AddressService.updateTxCountAndBalances(addresses, url)
}

AddressCreatedSubject.getSubject().subscribe(async (addresses: Address[]) => {
  const hasUsedAddresses = addresses.some(address => address.isImporting === true)
  killBlockSyncTask()
  const url: string = NodeService.getInstance().core.node.url
  const rpcService = new RpcService(url)
  const genesisBlockHash: string = await rpcService.genesisBlockHash()
  if (network?.chain === 'ckb' && genesisBlockHash !== network.genesisHash) {
    SyncedBlockNumberSubject.next('-1')
    return
  }
  await createBlockSyncTask(hasUsedAddresses)
})

// Network switch or network connect
// Param rescan: rescan start from genesis block.
const syncNetwork = async (rescan = false) => {
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
      backgroundWindow.webContents.send("block-sync:start", network.remote, network.genesisHash, lockHashes, rescan)
    }
    // re init txCount in addresses if switch network
    await updateAllAddressesTxCount(network.remote)
  }
}

export const switchToNetwork = async (newNetwork: Network, reconnected = false, shouldSync = true) => {
  const previousNetwork = network
  network = newNetwork

  if (previousNetwork && !reconnected) {
    if (previousNetwork.id === newNetwork.id || previousNetwork.genesisHash === newNetwork.genesisHash) {
      // There's no actual change. No need to reconnect.
      return
    }
  }

  if (reconnected) {
    logger.debug('Network reconnected to:', network)
  } else {
    logger.debug('Network switched to:', network)
  }

  killBlockSyncTask()
  if (shouldSync) {
    await createBlockSyncTask()
  } else {
    SyncedBlockNumberSubject.next('-1')
  }
}

export const createBlockSyncTask = async (rescan = false) => {
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
    syncNetwork(rescan)
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
