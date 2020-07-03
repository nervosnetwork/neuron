import { BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import { Address, AddressVersion } from 'database/address/address-dao'
import DataUpdateSubject from 'models/subjects/data-update'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import SyncedBlockNumberSubject from 'models/subjects/node'
import SyncedBlockNumber from 'models/synced-block-number'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'
import AssetAccountInfo from 'models/asset-account-info'
import { LumosCellQuery, LumosCell } from './sync/indexer-connector'
import IndexerFolderManager from './sync/indexer-folder-manager'

let backgroundWindow: BrowserWindow | null
let network: Network | null
let indexerQueryId: number = 0

const updateAllAddressesTxCountAndUsedByAnyoneCanPay = async (genesisBlockHash: string) => {
  const addrs = AddressService.allAddresses()
  const addresses = addrs.map(addr => addr.address)
  const assetAccountInfo = new AssetAccountInfo(genesisBlockHash)
  const anyoneCanPayLockHashes = addrs.map(a => assetAccountInfo.generateAnyoneCanPayScript(a.blake160).computeHash())
  await AddressService.updateTxCountAndBalances(addresses)
  const addressVersion = NetworksService.getInstance().isMainnet() ? AddressVersion.Mainnet : AddressVersion.Testnet
  await AddressService.updateUsedByAnyoneCanPayByBlake160s(anyoneCanPayLockHashes, addressVersion)
}

if (BrowserWindow) {
  AddressCreatedSubject.getSubject().subscribe(async (addresses: Address[]) => {
    // Force rescan when address is imported and there's no previous records (from existing identical wallet)
    const shouldRescan = addresses.some(address => address.isImporting === true)
    killBlockSyncTask()
    await createBlockSyncTask(shouldRescan)
  })
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
    logger.info('Network:\treconnected to:', network)
  } else {
    logger.info('Network:\tswitched to:', network)
  }

  killBlockSyncTask()
  if (shouldSync) {
    await createBlockSyncTask()
  } else {
    SyncedBlockNumberSubject.getSubject().next('-1')
  }
}

export const createBlockSyncTask = async (clearIndexerFolder = false) => {
  await CommonUtils.sleep(2000) // Do not start too fast

  if (clearIndexerFolder) {
    await new SyncedBlockNumber().setNextBlock(BigInt(0))
    IndexerFolderManager.resetIndexerData()
  }

  if (backgroundWindow) {
    return
  }

  logger.info('Sync:\tstarting background process')
  backgroundWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      preload: path.join(__dirname, './preload.js')
    }
  })

  backgroundWindow.on('ready-to-show', async () => {
    if (!network) {
      network = NetworksService.getInstance().getCurrent()
    }

    const startBlockNumber = (await new SyncedBlockNumber().getNextBlock()).toString()
    SyncedBlockNumberSubject.getSubject().next(startBlockNumber)
    logger.info('Sync:\tbackground process started, scan from block #' + startBlockNumber)

    DataUpdateSubject.next({
      dataType: 'transaction',
      actionType: 'update',
    })

    if (network.genesisHash !== EMPTY_GENESIS_HASH) {
      // re init txCount in addresses if switch network
      await updateAllAddressesTxCountAndUsedByAnyoneCanPay(network.genesisHash)
      if (backgroundWindow) {
        const addressesMetas = AddressService.allAddresses()
        backgroundWindow.webContents.send(
          "block-sync:start",
          network.remote,
          network.genesisHash,
          addressesMetas
        )
      }
    }
  })

  backgroundWindow.on('closed', () => {
    backgroundWindow = null
  })

  backgroundWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`)
}

export const killBlockSyncTask = () => {
  if (backgroundWindow) {
    logger.info('Sync:\tkill background process')
    backgroundWindow.close()
  }
}

export const queryIndexer = (query: LumosCellQuery): Promise<LumosCell[]> => {
  indexerQueryId ++
  return new Promise(resolve => {
    ipcMain.once(`block-sync:query-indexer:${indexerQueryId}`, (_event, results) => {
      resolve(results)
    });
    backgroundWindow!.webContents.send(
      "block-sync:query-indexer",
      query,
      indexerQueryId
    )
  })
}
