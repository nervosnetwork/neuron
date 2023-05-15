import env from '../env'
import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import process from 'process'
import logger from '../utils/logger'
import SettingsService from './settings'
import MigrateSubject from '../models/subjects/migrate-subject'
import IndexerService from './indexer'

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

const { app } = env
let ckb: ChildProcess | null = null

const ckbPath = (): string => {
  return app.isPackaged ? path.join(path.dirname(app.getAppPath()), '..', './bin') : path.join(__dirname, '../../bin')
}

const ckbBinary = (): string => {
  const binary = app.isPackaged ? path.resolve(ckbPath(), './ckb') : path.resolve(ckbPath(), `./${platform()}`, './ckb')
  return platform() === 'win' ? binary + '.exe' : binary
}

const initCkb = async () => {
  logger.info('CKB:\tInitializing node...')
  return new Promise<void>((resolve, reject) => {
    if (fs.existsSync(path.join(SettingsService.getInstance().ckbDataPath, 'ckb.toml'))) {
      logger.log('CKB:\tinit: config file detected, skip ckb init.')
      return resolve()
    }

    const initCmd = spawn(ckbBinary(), ['init', '--chain', 'mainnet', '-C', SettingsService.getInstance().ckbDataPath])
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

let isLookingValidTarget: boolean = false
let lastLogTime: number
export const getLookingValidTargetStatus = () => isLookingValidTarget

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

  logger.info('CKB:\tstarting node...')
  const options = ['run', '-C', SettingsService.getInstance().ckbDataPath, '--indexer']
  if (app.isPackaged && process.env.CKB_NODE_ASSUME_VALID_TARGET) {
    options.push('--assume-valid-target', process.env.CKB_NODE_ASSUME_VALID_TARGET)
  }
  ckb = spawn(ckbBinary(), options, { stdio: ['ignore', 'pipe', 'pipe'] })

  ckb.stderr &&
    ckb.stderr.on('data', data => {
      const dataString: string = data.toString()
      logger.error('CKB:\trun fail:', dataString)
      if (dataString.includes('CKB wants to migrate the data into new format')) {
        MigrateSubject.next({ type: 'need-migrate' })
      }
    })
  if (app.isPackaged && process.env.CKB_NODE_ASSUME_VALID_TARGET) {
    ckb.stdout &&
      ckb.stdout.on('data', data => {
        const dataString: string = data.toString()
        if (
          dataString.includes(
            `can't find assume valid target temporarily, hash: Byte32(${process.env.CKB_NODE_ASSUME_VALID_TARGET})`
          )
        ) {
          isLookingValidTarget = true
          lastLogTime = Date.now()
        } else if (lastLogTime && Date.now() - lastLogTime > 10000) {
          isLookingValidTarget = false
        }
      })
  }

  ckb.on('error', error => {
    logger.error('CKB:\trun fail:', error)
    isLookingValidTarget = false
    ckb = null
  })

  ckb.on('close', () => {
    logger.info('CKB:\tprocess closed')
    isLookingValidTarget = false
    ckb = null
  })

  removeOldIndexerIfRunSuccess()
}

export const stopCkbNode = () => {
  return new Promise<void>(resolve => {
    if (ckb) {
      logger.info('CKB:\tkilling node')
      ckb.once('close', () => resolve())
      ckb.kill('SIGKILL')
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
  fs.rmSync(SettingsService.getInstance().ckbDataPath, { recursive: true, force: true })
  await startCkbNode()
}

export function migrateCkbData() {
  logger.info('CKB migrate:\tstarting...')
  const options = ['migrate', '-C', SettingsService.getInstance().ckbDataPath, '--force']
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
