import { BrowserWindow } from 'electron'
import path from 'path'
import { fork, ChildProcess } from 'child_process'
import SyncApiController from 'controllers/sync-api'
import NetworksService from 'services/networks'
import AddressService from 'services/addresses'
import WalletService from 'services/wallets'
import IndexerService from 'services/indexer'
import { Network, EMPTY_GENESIS_HASH } from 'models/network'
import DataUpdateSubject from 'models/subjects/data-update'
import AddressCreatedSubject from 'models/subjects/address-created-subject'
import WalletDeletedSubject from 'models/subjects/wallet-deleted-subject'
import SyncedBlockNumber from 'models/synced-block-number'
import TxDbChangedSubject from 'models/subjects/tx-db-changed-subject'
import { LumosCellQuery, LumosCell } from './sync/indexer-connector'
import { WorkerMessage, StartParams, QueryIndexerParams } from './task'
import logger from 'utils/logger'
import CommonUtils from 'utils/common'
import env from 'env'

let network: Network | null
let child: ChildProcess | null = null
let requestId = 0
let requests = new Map<number, Record<'resolve' | 'reject', Function>>()

if (BrowserWindow) {
  AddressCreatedSubject.getSubject().subscribe(() => resetSyncTask())
  WalletDeletedSubject.getSubject().subscribe(() => resetSyncTask())
}

export const killBlockSyncTask = async () => {
  const _child = child
  child = null
  if (!_child) {return}

  logger.info('Sync:\tdrain requests')
  await Promise.all(
    [...requests.values()].map(
      ({ reject }) =>
        typeof reject === 'function'
          ? reject()
          : logger.error(`Worker:\treject is not a function, get ${reject}`)
    ))
    .finally(() => requests = new Map())

  logger.info('Sync:\tkill block sync task')
  const msg: Required<WorkerMessage> = {
    type: 'call',
    id: requestId++,
    channel: 'unmount',
    message: null
  }
  await new Promise((resolve, reject) => {
    requests.set(msg.id, { resolve, reject })
    _child.send(msg, err => {
      if (err) {
        reject(err)
      }
    })
  })

  await new Promise(resolve => {
    _child.once('close', () => resolve(0))
    _child.kill()
  })

  const mercury = IndexerService.getInstance()
  await mercury.stop()
}

export const resetSyncTask = async (startTask = true, clearIndexerFolder = false) => {
  await killBlockSyncTask()
  await WalletService.getInstance().maintainAddressesIfNecessary()

  if (startTask) {
    await CommonUtils.sleep(3000)
    await createBlockSyncTask(clearIndexerFolder)
  }
}

export const switchToNetwork = async (newNetwork: Network, reconnected = false, shouldSync = true) => {
  if (network && !reconnected && network.id === newNetwork.id) {return}

  network = newNetwork

  if (reconnected) {
    logger.info('Network:\treconnected to:', network)
  } else {
    logger.info('Network:\tswitched to:', network)
  }

  await resetSyncTask(shouldSync)
}

const createBlockSyncTask = async (clearIndexerFolder: boolean) => {
  await killBlockSyncTask()

  const mercury = IndexerService.getInstance()

  if (clearIndexerFolder) {
    mercury.clearData()
    await new SyncedBlockNumber().setNextBlock(BigInt(0))
  }

  await mercury.start()

  logger.info('Sync:\tstarting background process')

  // prevents the sync task from being started repeatedly if fork does not finish executing.
  child = fork(path.join(__dirname, 'task-wrapper.js'), [], {
    env: { fileBasePath: env.fileBasePath },
    stdio: ['ipc', process.stdout, 'pipe']
  })

  child.on('message', ({ id, message, channel }: WorkerMessage) => {
    if (id !== undefined) {
      if (!requests.has(id)) {return}
      const { resolve } = requests.get(id)!
      requests.delete(id)
      if (typeof resolve === 'function') {
        try {
          resolve(message)
        } catch (err) {
          logger.error(`Sync Block Task:\t${err}`)
        }
      } else {
        logger.error(`Sync Block Task:\tresolve expected, got ${resolve}`)
      }

    } else {
      switch (channel) {
        case 'cache-tip-block-updated':
          SyncApiController.emiter.emit('cache-tip-block-updated', message)
          break
        case 'tx-db-changed':
          TxDbChangedSubject.getSubject().next(message)
          break
        // case 'address-db-changed':
        //   AddressDbChangedSubject.getSubject().next(msg.result)
        //   break
        case 'wallet-deleted':
        case 'address-created':
        case 'indexer-error':
          resetSyncTask()
          break
        default:
          break
      }

    }
  })

  child.stderr!.setEncoding('utf8').on('data', async data => {
    logger.error('Sync:ChildProcess:', data)
  })


  if (!network) {
    network = NetworksService.getInstance().getCurrent()
  }

  DataUpdateSubject.next({
    dataType: 'transaction',
    actionType: 'update',
  })

  const _child = child

  if (network.genesisHash !== EMPTY_GENESIS_HASH) {
    const addressMetas = await AddressService.getAddressesByAllWallets()
    const message: StartParams = { genesisHash: network.genesisHash, url: network.remote, addressMetas, indexerUrl: IndexerService.LISTEN_URI }
    const msg: Required<WorkerMessage<StartParams>> = { type: 'call', channel: 'start', id: requestId++, message }
    await new Promise((resolve, reject) => {
      requests.set(msg.id, { resolve, reject })
      _child.send(msg, err => {
        if (err) { reject(err) }
      })
    })
  }
}

export const queryIndexer = async (query: LumosCellQuery): Promise<LumosCell[]> => {
  const _child = child
  if (!_child) { return [] }
  const id = requestId++
  const msg: Required<WorkerMessage<QueryIndexerParams>> = { type: 'call', id, channel: 'queryIndexer', message: query }

  return new Promise((resolve, reject) => {
    requests.set(msg.id, { resolve, reject })
    _child.send(msg, err => {
      if (err) {
        logger.error(`Query Indexer:\t`, err)
        reject(err)
      }
    })
  })
}

