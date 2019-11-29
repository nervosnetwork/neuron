import { app as electronApp, remote } from 'electron'
import path from 'path'
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

const app = electronApp || remote.app
let ckb: ChildProcess | null = null

const ckbPath = (): string => {
  return app.isPackaged ?
    path.join(path.dirname(app.getAppPath()), '..', './bin') :
    path.join(__dirname, '../../../bin',)
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

const initCkb = () => {
  logger.info('Initializing CKB')
  const init = spawn(ckbBinary(), ['init', '--chain', 'mainnet', '-C', ckbDataPath()])
  init.stderr.on('data', data => {
    logger.error('CKB init fail:', data.toString())
  })
  init.stdout.on('data', data => {
    logger.log('CKB init result:', data.toString())
  })

  return init
}

export const startCkbNode = async () => {
  const init = initCkb()
  init.on('close', () => {
    logger.info('Starting CKB')
    ckb = spawn(ckbBinary(), ['run', '-C', ckbDataPath()])
    ckb.stderr && ckb.stderr.on('data', data => {
      logger.error('CKB run fail:', data.toString())
    })
    ckb.stdout && ckb.stdout.on('data', _data => {
      // Do not log here. CKB has its own run.log in data/logs.
    })
  })
}

export const stopCkbNode = async () => {
  if (ckb) {
    logger.info('Killing CKB')
    ckb.kill()
    ckb = null
  }
}