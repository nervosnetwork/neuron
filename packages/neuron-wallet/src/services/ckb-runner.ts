import { app as electronApp, remote } from 'electron'
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

const app = electronApp || remote.app
let ckb: ChildProcess | null = null

const ckbPath = (): string => {
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
  logger.info('Initializing CKB...')
  return new Promise((resolve, reject) => {
    const initCmd = spawn(ckbBinary(), ['init', '--chain', 'mainnet', '-C', ckbDataPath()])
    initCmd.stderr.on('data', data => {
      logger.error('CKB init fail:', data.toString())
    })
    initCmd.stdout.on('data', data => {
      logger.log('CKB init result:', data.toString())
    })

    initCmd.on('error', error => {
      // Mostly ckb binary is not found
      logger.error('CKB init fail:', error)
      reject()
    })

    initCmd.on('close', () => {
      // `ckb init` always quits no matter it fails (usually due to config file already existing) or not.
      resolve()
    })
  })
}

// Enable all avaiable modules to have Indexer
const enableAllModules = () => {
  const configFilePath = path.resolve(ckbDataPath(), 'ckb.toml')
  try {
    let data = fs.readFileSync(configFilePath, 'utf8')
      // Enable all modules by removing the current config, and using the full list.
      if (data.includes('# List of API modules: ')) {
        let content = data.replace(/modules =/g, '# modules =')
        content = content.replace(/# List of API modules: /g, 'modules = ')
        fs.writeFileSync(configFilePath, content)
      }
  } catch (error) {
    logger.error('Enable CKB Indexer module fail:', error)
  }
}

export const startCkbNode = async () => {
  initCkb().then(async () => {
    logger.info('Enable CKB Indexer module...')
    enableAllModules()

    logger.info('Starting CKB...')
    ckb = spawn(ckbBinary(), ['run', '-C', ckbDataPath()])
    ckb.stderr && ckb.stderr.on('data', data => {
      logger.error('CKB run fail:', data.toString())
    })

    ckb.on('error', error => {
      logger.error('CKB run fail:', error)
      ckb = null
    })

    ckb.on('close', () => {
      logger.info('CKB process closed.')
      ckb = null
    })
  })
}

export const stopCkbNode = () => {
  if (ckb) {
    logger.info('Killing CKB')
    ckb.kill()
    ckb = null
  }
}
