import { BrowserWindow } from 'electron'
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
import MultiSign from 'models/multi-sign'
import AssetAccountInfo from 'models/asset-account-info'

let backgroundWindow: BrowserWindow | null
let network: Network | null

const updateAllAddressesTxCountAndUsedByAnyoneCanPay = async (genesisBlockHash: string) => {
  const addrs = AddressService.allAddresses()
  const addresses = addrs.map(addr => addr.address)
  const assetAccountInfo = new AssetAccountInfo(genesisBlockHash)
  const anyoneCanPayLockHashes = addrs.map(a => assetAccountInfo.generateAnyoneCanPayScript(a.blake160).computeHash())
  await AddressService.updateTxCountAndBalances(addresses)
  const addressVersion = NetworksService.getInstance().isMainnet() ? AddressVersion.Mainnet : AddressVersion.Testnet
  await AddressService.updateUsedByAnyoneCanPayByBlake160s(anyoneCanPayLockHashes, addressVersion)
}

AddressCreatedSubject.getSubject().subscribe(async (addresses: Address[]) => {
  // Force rescan when address is imported and there's no previous records (from existing identical wallet)
  const shouldRescan = addresses.some(address => address.isImporting === true)
  killBlockSyncTask()
  await createBlockSyncTask(shouldRescan)
})

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

export const createBlockSyncTask = async (rescan = false) => {
  await CommonUtils.sleep(2000) // Do not start too fast

  if (rescan) {
    await new SyncedBlockNumber().setNextBlock(BigInt(0))
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
        const lockHashes = AddressService.allLockHashes()
        const blake160s = AddressService.allAddresses().map(address => address.blake160)
        const multiSign = new MultiSign()
        const multiSignBlake160s = blake160s.map(blake160 => multiSign.hash(blake160))
        const assetAccountInfo = new AssetAccountInfo(network.genesisHash)
        const anyoneCanPayLockHashes: string[] = blake160s
          .map(b => assetAccountInfo.generateAnyoneCanPayScript(b).computeHash())

        backgroundWindow.webContents.send(
          "block-sync:start",
          network.remote,
          network.genesisHash,
          lockHashes,
          anyoneCanPayLockHashes,
          startBlockNumber,
          multiSignBlake160s
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
