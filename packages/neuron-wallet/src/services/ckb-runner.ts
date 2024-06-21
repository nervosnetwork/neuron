import env from '../env'
import path from 'path'
import fs from 'fs'
import { ChildProcess, StdioNull, StdioPipe, spawn } from 'child_process'
import process from 'process'
import logger from '../utils/logger'
import SettingsService from './settings'
import MigrateSubject from '../models/subjects/migrate-subject'
import IndexerService from './indexer'
import { resetSyncTaskQueue } from '../block-sync-renderer'
import { getUsablePort } from '../utils/get-usable-port'
import { updateToml } from '../utils/toml'
import { BUNDLED_URL_PREFIX } from '../utils/const'
import NoDiskSpaceSubject from '../models/subjects/no-disk-space'

const platform = (): string => {
  switch (process.platform) {
    case 'win32':
      return 'win'
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'mac'
    default:
      return ''
  }
}

enum NeedMigrateMsg {
  Wants = 'CKB wants to migrate the data into new format',
  Recommends = 'CKB recommends migrating your data into a new format',
}

const { app } = env
let ckb: ChildProcess | null = null

const ckbPath = (): string => {
  return app.isPackaged ? path.join(path.dirname(app.getAppPath()), '..', './bin') : path.join(__dirname, '../../bin')
}

const ckbBinary = (): string => {
  const binary = app.isPackaged ? path.resolve(ckbPath(), './ckb') : path.resolve(ckbPath(), `./${platform()}`, './ckb')
  switch (platform()) {
    case 'win':
      return binary + '.exe'
    case 'mac':
      if (app.isPackaged) {
        return binary
      }
      return `${binary}-${process.arch === 'arm64' ? 'arm64' : 'x64'}`
    default:
      return binary
  }
}

let rpcPort: number = 8114
let listenPort: number = 8115

const initCkb = async () => {
  logger.info('CKB:\tInitializing node...')
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(path.join(SettingsService.getInstance().getNodeDataPath(), 'ckb.toml'))) {
      logger.log('CKB:\tinit: config file detected, skip ckb init.')
      return resolve()
    }

    const initCmd = spawn(ckbBinary(), [
      'init',
      '--chain',
      'mainnet',
      '-C',
      SettingsService.getInstance().getNodeDataPath(),
    ])
    initCmd.stderr.on('data', data => {
      logger.error('CKB:\tinit fail:', data.toString())
    })
    initCmd.stdout.on('data', data => {
      logger.log('CKB:\tinit result:', data.toString())
    })

    initCmd.on('error', error => {
      // Mostly ckb binary is not found
      logger.error('CKB:\tinit fail:', error)
      reject()
    })

    initCmd.on('close', () => {
      // `ckb init` always quits no matter it fails (usually due to config file already existing) or not.
      resolve()
    })
  })
}

export const getNodeUrl = () => `${BUNDLED_URL_PREFIX}${rpcPort}`

const removeOldIndexerIfRunSuccess = () => {
  setTimeout(() => {
    if (ckb !== null) {
      IndexerService.cleanOldIndexerData()
    }
  }, 10000)
}

export const startCkbNode = async () => {
  if (ckb !== null) {
    logger.info(`CKB:\tckb is not closed, close it before start...`)
    await stopCkbNode()
  }
  await initCkb()
  rpcPort = await getUsablePort(rpcPort)
  listenPort = await getUsablePort(rpcPort >= listenPort ? rpcPort + 1 : listenPort)

  updateToml(path.join(SettingsService.getInstance().getNodeDataPath(), 'ckb.toml'), {
    rpc: {
      listen_address: `"127.0.0.1:${rpcPort}"`,
    },
    network: {
      listen_addresses: `["/ip4/0.0.0.0/tcp/${listenPort}"]`,
    },
  })
  const options = ['run', '-C', SettingsService.getInstance().getNodeDataPath(), '--indexer']
  const stdio: (StdioNull | StdioPipe)[] = ['ignore', 'pipe', 'pipe']
  if (app.isPackaged && process.env.CKB_NODE_ASSUME_VALID_TARGET) {
    options.push('--assume-valid-target', process.env.CKB_NODE_ASSUME_VALID_TARGET)
  }
  logger.info(`CKB:\tckb full node will with rpc port ${rpcPort}, listen port ${listenPort}, with options`, options)
  const currentProcess = spawn(ckbBinary(), options, { stdio })

  currentProcess.stderr?.on('data', data => {
    const dataString: string = data.toString()
    logger.error('CKB:\trun fail:', dataString)
    if (dataString.includes(NeedMigrateMsg.Wants) || dataString.includes(NeedMigrateMsg.Recommends)) {
      MigrateSubject.next({ type: 'need-migrate' })
    }
  })
  currentProcess.stdout?.on('data', data => {
    const dataString: string = data.toString()
    if (/No space left/.test(dataString)) {
      NoDiskSpaceSubject.next(true)
      logger.error('CKB:\trun fail:', dataString)
      return
    }
  })

  currentProcess.on('error', error => {
    logger.error('CKB:\trun fail:', error)
    if (Object.is(ckb, currentProcess)) {
      ckb = null
    }
  })

  currentProcess.on('close', code => {
    logger.info(`CKB:\tprocess closed with code ${code}`)
    if (Object.is(ckb, currentProcess)) {
      ckb = null
    }
  })

  ckb = currentProcess

  removeOldIndexerIfRunSuccess()
}

export const stopCkbNode = () => {
  return new Promise<void>(resolve => {
    if (ckb) {
      logger.info('CKB:\tkilling node')
      ckb.once('close', () => resolve())
      ckb.kill()
      ckb = null
    } else {
      resolve()
    }
  })
}

/**
 * remove ckb data
 */
export const clearCkbNodeCache = async () => {
  await stopCkbNode()
  fs.rmSync(SettingsService.getInstance().getNodeDataPath(), { recursive: true, force: true })
  await startCkbNode()
  resetSyncTaskQueue.asyncPush(true)
}

export function migrateCkbData() {
  logger.info('CKB migrate:\tstarting...')
  const options = ['migrate', '-C', SettingsService.getInstance().getNodeDataPath(), '--force']
  MigrateSubject.next({ type: 'migrating' })
  let migrate: ChildProcess | null = spawn(ckbBinary(), options, { stdio: ['ignore', 'pipe', 'pipe'] })

  let lastErrorData = ''
  migrate.stderr &&
    migrate.stderr.on('data', data => {
      logger.error('CKB migrate:\trun fail:', data.toString())
      lastErrorData = data.toString()
    })

  migrate.on('close', code => {
    logger.info(`CKB migrate:\tprocess process exited with code ${code}`)
    if (code === 0) {
      MigrateSubject.next({ type: 'finish' })
      IndexerService.cleanOldIndexerData()
    } else {
      MigrateSubject.next({ type: 'failed', reason: lastErrorData })
    }
    migrate = null
  })
}
