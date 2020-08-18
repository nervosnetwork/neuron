import { BrowserWindow } from 'electron'
import path from 'path'
import { fork } from 'child_process'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import { AddressVersion } from 'database/address/address-dao'
import DataUpdateSubject from 'models/subjects/data-update'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletDeletedSubject from 'models/subjects/wallet-deleted-subject'
import SyncedBlockNumberSubject from 'models/subjects/node'
import SyncedBlockNumber from 'models/synced-block-number'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'
import AssetAccountInfo from 'models/asset-account-info'
import { LumosCellQuery, LumosCell } from './sync/indexer-connector'
import IndexerFolderManager from './sync/indexer-folder-manager'
import { spawn, terminate, subscribe } from 'utils/worker'
import SyncApiController from 'controllers/sync-api'
import type { SyncTask } from './task'
import env from 'env'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'

let syncTask: SyncTask | null
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

if (BrowserWindow) {
  AddressCreatedSubject.getSubject().subscribe(async () => {
    await killBlockSyncTask()
    await createBlockSyncTask()
  })
  WalletDeletedSubject.getSubject().subscribe(async () => {
    await killBlockSyncTask()
    await createBlockSyncTask()
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

  await killBlockSyncTask()
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

  if (syncTask) {
    return
  }

  logger.info('Sync:\tstarting background process')

  syncTask = await spawn<SyncTask>(
    fork(path.join(__dirname, 'task.js'), [], {
      env: {
        fileBasePath: env.fileBasePath
      }
    })
  )

  subscribe(syncTask, msg => {
    switch (msg?.channel) {
      case 'synced-block-number-updated':
        SyncApiController.emiter.emit('synced-block-number-updated', msg?.result)
        break
      case 'tx-db-changed':
        TxDbChangedSubject.getSubject().next(msg?.result)
        break
      case 'address-db-changed':
        AddressDbChangedSubject.getSubject().next(msg?.result)
        break
      default:
        break
    }
  })

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
    syncTask?.start(
      network.remote,
      network.genesisHash,
      AddressService.allAddresses()
    )
  }
}

export const killBlockSyncTask = async () => {
  if (syncTask) {
    logger.info('Sync:\tkill background process')
    await syncTask.unmount()
    terminate(syncTask)
    syncTask = null
  }
}

export const queryIndexer = (query: LumosCellQuery): Promise<LumosCell[]> => {
  return syncTask?.queryIndexer(query) as any
}
