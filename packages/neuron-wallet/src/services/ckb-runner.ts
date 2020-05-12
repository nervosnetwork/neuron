import env from 'env'
import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import logger from 'utils/logger'

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

export const ckbPath = (): string => {
  return app.isPackaged ?
    path.join(path.dirname(app.getAppPath()), '..', './bin') :
    path.join(__dirname, '../../bin',)
}

const ckbBinary = (): string => {
  const binary = app.isPackaged ?
    path.resolve(ckbPath(), './ckb') :
    path.resolve(ckbPath(), `./${platform()}`, './ckb')
  return platform() === 'win' ? binary + '.exe' : binary
}

const ckbDataPath = (): string => {
  return path.resolve(app.getPath('userData',), 'chains/mainnet')
}

const initCkb = async () => {
  logger.info('CKB:\tInitializing node...')
  return new Promise((resolve, reject) => {
    if (fs.existsSync(path.join(ckbDataPath(), 'ckb.toml'))) {
      logger.log('CKB:\tinit: config file detected, skip ckb init.')
      return resolve()
    }

    const initCmd = spawn(ckbBinary(), ['init', '--chain', 'mainnet', '-C', ckbDataPath()])
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

export const startCkbNode = async () => {
  await initCkb()

  logger.info('CKB:\tstarting node...')
  ckb = spawn(ckbBinary(), ['run', '-C', ckbDataPath()], { stdio: ['ignore', 'ignore', 'pipe'] })
  ckb.stderr && ckb.stderr.on('data', data => {
    logger.error('CKB:\trun fail:', data.toString())
    ckb = null
  })

  ckb.on('error', error => {
    logger.error('CKB:\trun fail:', error)
    ckb = null
  })

  ckb.on('close', () => {
    logger.info('CKB:\tprocess closed')
    ckb = null
  })
}

export const stopCkbNode = () => {
  if (ckb) {
    logger.info('CKB:\tkilling node')
    ckb.kill()
    ckb = null
  }
}
