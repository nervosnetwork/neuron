import { BrowserWindow } from 'electron'
import path from 'path'
import { fork } from 'child_process'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import DataUpdateSubject from 'models/subjects/data-update'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletDeletedSubject from 'models/subjects/wallet-deleted-subject'
import SyncedBlockNumberSubject from 'models/subjects/node'
import SyncedBlockNumber from 'models/synced-block-number'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import WalletService from 'services/wallets'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'
import { LumosCellQuery, LumosCell } from './sync/indexer-connector'
import IndexerFolderManager from './sync/indexer-folder-manager'
import { spawn, terminate, subscribe as subscribeToWorkerProcess } from 'utils/worker'
import SyncApiController from 'controllers/sync-api'
import type { SyncTask } from './task'
import env from 'env'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'

let syncTask: SyncTask | null
let network: Network | null

const restartSyncTask = async () => {
  await killBlockSyncTask()
  await createBlockSyncTask()
}

if (BrowserWindow) {
  AddressCreatedSubject.getSubject().subscribe(restartSyncTask)
  WalletDeletedSubject.getSubject().subscribe(restartSyncTask)
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
  //TODO evalutate if this is necessary. This might be unnecessary legacy code.
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

  // prevents the sync task from being started repeatedly if fork does not finish executing.
  syncTask = Object.create(null)
  syncTask = await spawn<SyncTask>(
    fork(path.join(__dirname, 'task-wrapper.js'), [], {
      env: {
        fileBasePath: env.fileBasePath
      }
    })
  )

  subscribeToWorkerProcess(syncTask, msg => {
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
      case 'wallet-deleted':
      case 'address-created':
        restartSyncTask()
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
    await WalletService.getInstance().generateAddressesIfNecessary()

    // re init txCount in addresses if switch network
    syncTask?.start(
      network.remote,
      network.genesisHash,
      await AddressService.getAddressesByAllWallets()
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

export const queryIndexer = async (query: LumosCellQuery): Promise<LumosCell[]> => {
  try {
    const results = await syncTask?.queryIndexer(query) as LumosCell[]
    return results || []
  } catch (error) {
    logger.error(error)
    return []
  }
}
