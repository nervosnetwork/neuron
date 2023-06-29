import path from 'path'
import { fork, ChildProcess } from 'child_process'
import SyncApiController from '../controllers/sync-api'
import NetworksService from '../services/networks'
import AddressService from '../services/addresses'
import WalletService from '../services/wallets'
import { Network, EMPTY_GENESIS_HASH } from '../models/network'
import DataUpdateSubject from '../models/subjects/data-update'
import AddressCreatedSubject from '../models/subjects/address-created-subject'
import WalletDeletedSubject from '../models/subjects/wallet-deleted-subject'
import TxDbChangedSubject from '../models/subjects/tx-db-changed-subject'
import { LumosCellQuery, LumosCell } from './sync/connector'
import { WorkerMessage, StartParams, QueryIndexerParams } from './task'
import logger from '../utils/logger'
import CommonUtils from '../utils/common'
import queueWrapper from '../utils/queue'
import env from '../env'
import MultisigConfigDbChangedSubject from '../models/subjects/multisig-config-db-changed-subject'
import Multisig from '../services/multisig'
import { SyncAddressType } from '../database/chain/entities/sync-progress'
import { debounceTime } from 'rxjs/operators'

let network: Network | null
let child: ChildProcess | null = null
let requestId = 0
let requests = new Map<number, Record<'resolve' | 'reject', (val?: unknown) => unknown>>()

export const killBlockSyncTask = async () => {
  const _child = child
  child = null
  if (!_child) {
    return
  }

  logger.info('Sync:\tdrain requests')
  await Promise.all(
    [...requests.values()].map(({ reject }) =>
      typeof reject === 'function' ? reject() : logger.error(`Worker:\treject is not a function, get ${reject}`)
    )
  ).finally(() => (requests = new Map()))

  await waitForChildClose(_child)
}

const waitForChildClose = (c: ChildProcess) =>
  new Promise((resolve, reject) => {
    c.once('close', resolve)
    const msg: Required<WorkerMessage> = {
      type: 'call',
      id: requestId++,
      channel: 'unmount',
      message: null,
    }
    c.send(msg, err => {
      if (err) {
        reject(err)
      }
    })
  }).catch(() => 0)

export const resetSyncTask = async (startTask = true) => {
  await killBlockSyncTask()

  if (startTask) {
    await WalletService.getInstance().maintainAddressesIfNecessary()
    await CommonUtils.sleep(3000)
    await createBlockSyncTask()
  }
}

export const resetSyncTaskQueue = queueWrapper(resetSyncTask, 1, true)

export const switchToNetwork = async (newNetwork: Network, reconnected = false, shouldSync = true) => {
  if (!reconnected && network?.id === newNetwork.id && network?.genesisHash === newNetwork.genesisHash) {
    return
  }

  network = newNetwork

  if (reconnected) {
    logger.info('Network:\treconnected to:', network)
  } else {
    logger.info('Network:\tswitched to:', network)
  }

  await resetSyncTaskQueue.asyncPush(shouldSync)
}

export const queryIndexer = async (query: LumosCellQuery): Promise<LumosCell[]> => {
  const _child = child
  if (!_child) {
    return []
  }
  const msg: Required<WorkerMessage<QueryIndexerParams>> = {
    type: 'call',
    id: requestId++,
    channel: 'queryIndexer',
    message: query,
  }
  return registerRequest(_child, msg).catch(err => {
    logger.error(`Sync:\tfailed to register query indexer task`, err)
    return []
  }) as Promise<LumosCell[]>
}

export const createBlockSyncTask = async () => {
  logger.info('Sync:\tstart')

  // prevents the sync task from being started repeatedly if fork does not finish executing.
  child = fork(path.join(__dirname, 'task-wrapper.js'), [], {
    env: { fileBasePath: env.fileBasePath },
    stdio: ['ipc', process.stdout, 'pipe'],
    execArgv: env.app.isPackaged ? [] : ['--inspect'],
  })

  child.on('message', ({ id, message, channel }: WorkerMessage) => {
    if (id !== undefined) {
      if (!requests.has(id)) {
        return
      }
      const { resolve } = requests.get(id)!
      requests.delete(id)
      if (typeof resolve === 'function') {
        try {
          resolve(message)
        } catch (err) {
          logger.error(`Sync:\t${err}`)
        }
      } else {
        logger.error(`Sync:\tresolve expected, got ${resolve}`)
      }
    } else {
      switch (channel) {
        case 'cache-tip-block-updated':
          SyncApiController.emiter.emit('cache-tip-block-updated', message)
          break
        case 'check-and-save-wallet-address':
          WalletService.getInstance().checkAndGenerateAddress(message)
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
          resetSyncTaskQueue.asyncPush(true)
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
    const message: StartParams = {
      genesisHash: network.genesisHash,
      url: network.remote,
      addressMetas,
      indexerUrl: network.remote,
    }
    const msg: Required<WorkerMessage<StartParams>> = { type: 'call', channel: 'start', id: requestId++, message }
    return registerRequest(_child, msg).catch(err => {
      logger.error(`Sync:\ffailed to register sync task`, err)
    })
  }
}

export const registerRequest = (c: ChildProcess, msg: Required<WorkerMessage>) =>
  new Promise((resolve, reject) => {
    requests.set(msg.id, { resolve, reject })
    c.send(msg, err => {
      if (err) {
        logger.error(`Sync:\tfailed to send message to child process: ${msg}`)
        reject(err)
      }
    })
  })

AddressCreatedSubject.getSubject().subscribe(() => resetSyncTaskQueue.asyncPush(true))
WalletDeletedSubject.getSubject().subscribe(() => resetSyncTaskQueue.asyncPush(true))
MultisigConfigDbChangedSubject.getSubject()
  .pipe(debounceTime(1000))
  .subscribe(async () => {
    if (!child) {
      return
    }
    const appendScripts = await Multisig.getMultisigConfigForLight()
    const msg: Required<
      WorkerMessage<{ walletId: string; script: CKBComponents.Script; addressType: SyncAddressType }[]>
    > = { type: 'call', channel: 'append_scripts', id: requestId++, message: appendScripts }
    return registerRequest(child, msg).catch(err => {
      logger.error(`Sync:\ffailed to append script to light client`, err)
    })
  })
