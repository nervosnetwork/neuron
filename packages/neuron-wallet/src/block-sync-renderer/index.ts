import { BrowserWindow } from 'electron'
import path from 'path'
import { fork } from 'child_process'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import DataUpdateSubject from 'models/subjects/data-update'
import env from 'env'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletDeletedSubject from 'models/subjects/wallet-deleted-subject'
import SyncedBlockNumber from 'models/synced-block-number'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import WalletService from 'services/wallets'
import logger from 'utils/logger'
import { LumosCellQuery, LumosCell } from './sync/indexer-connector'
import IndexerFolderManager from './sync/indexer-folder-manager'
import { spawn, terminate, subscribe as subscribeToWorkerProcess } from 'utils/worker'
import SyncApiController from 'controllers/sync-api'
import type { SyncTask } from './task'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import { queue } from 'async'

let syncTask: SyncTask | null
let network: Network | null

const resetSyncTaskQueue = queue(async ({startTask, clearIndexerFolder}) => {
  await killBlockSyncTask()
  if (startTask) {
    await createBlockSyncTask(clearIndexerFolder)
  }
}, 1)

resetSyncTaskQueue.error(err => {
  logger.error(err)
})

export const resetSyncTask = async (startTask: boolean = true, clearIndexerFolder: boolean = false) => {
  if (resetSyncTaskQueue.length() === 0) {
    resetSyncTaskQueue.push({startTask, clearIndexerFolder})
    await resetSyncTaskQueue.drain()
  }
}

if (BrowserWindow) {
  AddressCreatedSubject.getSubject().subscribe(() => resetSyncTask())
  WalletDeletedSubject.getSubject().subscribe(() => resetSyncTask())
}

export const switchToNetwork = async (newNetwork: Network, reconnected = false, shouldSync = true) => {
  const previousNetwork = network
  network = newNetwork

  if (previousNetwork && !reconnected) {
    if (previousNetwork.id === newNetwork.id) {
      // There's no actual change. No need to reconnect.
      return
    }
  }

  if (reconnected) {
    logger.info('Network:\treconnected to:', network)
  } else {
    logger.info('Network:\tswitched to:', network)
  }

  await resetSyncTask(shouldSync)
}

export const createBlockSyncTask = async (clearIndexerFolder: boolean) => {
  if (clearIndexerFolder) {
    await new SyncedBlockNumber().setNextBlock(BigInt(0))
    IndexerFolderManager.resetIndexerData()
  }

  logger.info('Sync:\tstarting background process')

  // prevents the sync task from being started repeatedly if fork does not finish executing.
  const childProcess = fork(path.join(__dirname, 'task-wrapper.js'), [], {
    env: {
      fileBasePath: env.fileBasePath
    },
    stdio: ['ipc', process.stdout, 'pipe']
  })
  childProcess.stderr!.setEncoding('utf8').on('data', data => {
    logger.error('Sync:ChildProcess:', data)
  })
  syncTask = await spawn<SyncTask>(childProcess)

  subscribeToWorkerProcess(syncTask, msg => {
    switch (msg.channel) {
      case 'sync-estimate-updated':
        SyncApiController.emiter.emit('sync-estimate-updated', msg.result)
        break
      case 'tx-db-changed':
        TxDbChangedSubject.getSubject().next(msg.result)
        break
      case 'address-db-changed':
        AddressDbChangedSubject.getSubject().next(msg.result)
        break
      case 'wallet-deleted':
      case 'address-created':
        resetSyncTask()
        break
      default:
        break
    }
  })

  if (!network) {
    network = NetworksService.getInstance().getCurrent()
  }

  DataUpdateSubject.next({
    dataType: 'transaction',
    actionType: 'update',
  })

  if (network.genesisHash !== EMPTY_GENESIS_HASH) {
    await WalletService.getInstance().generateAddressesIfNecessary()

    // re init txCount in addresses if switch network
    syncTask!.start(
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
    await terminate(syncTask)
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
