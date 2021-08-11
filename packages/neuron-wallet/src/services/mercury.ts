import env from 'env'
import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import process from 'process'
import logger from 'utils/logger'
import { Network } from 'models/network'
import TOML from '@iarna/toml'
import { deleteFolderRecursive } from 'block-sync-renderer/sync/indexer-folder-manager'
import NetworksService from './networks'

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

export default class MercuryService {
  private mercury: ChildProcess | null = null
  private static instance: MercuryService
  public static PORT = '8118'
  public static LISTEN_URI = `http://localhost:${MercuryService.PORT}`

  public static getInstance = () => {
    if (!MercuryService.instance) {
      MercuryService.instance = new MercuryService()
    }
    return MercuryService.instance
  }

  static getPath = (): string => {
    return app.isPackaged ?
      path.join(path.dirname(app.getAppPath()), '..', './bin') :
      path.join(__dirname, '../../bin',)
  }

  static getDefaultConfig = (isMainnet: boolean): string => {
    const filename = `${isMainnet ? 'mainnet' : 'testnet'}_config.toml`
    return app.isPackaged ?
      path.resolve(MercuryService.getPath(), `./${filename}`) :
      path.resolve(MercuryService.getPath(), `./${platform()}`, `./${filename}`)
  }

  static getBinary = (): string => {
    const binary = app.isPackaged ?
      path.resolve(MercuryService.getPath(), './mercury') :
      path.resolve(MercuryService.getPath(), `./${platform()}`, './mercury')
    return platform() === 'win' ? binary + '.exe' : binary
  }

  getDataPath = (network: Network): string => {
    return path.resolve(app.getPath('userData'), './mercury', `./${network.chain}`, `./${network.id}`)
  }

  getConfigPath = (network: Network): string => {
    const dataPath = this.getDataPath(network)
    return path.resolve(dataPath, './config.toml')
  }

  createConfig = (network: Network) => {
    const dataPath = this.getDataPath(network)
    const configPath = path.resolve(dataPath, './config.toml')
    if (fs.existsSync(configPath)) {
      return configPath
    }
    const defaultTomlPath = MercuryService.getDefaultConfig(network.chain === 'ckb')
    const storePath = path.resolve(dataPath, './db')
    // mercury throws if folder is not exist
    MercuryService.createFolder(storePath)
    const snapshotPath = path.resolve(dataPath, './snapshot')
    MercuryService.createFolder(snapshotPath)
    const toml = fs.readFileSync(defaultTomlPath, 'utf-8')
    const config: Record<string, any> = TOML.parse(toml)
    config.store_path = storePath
    config.snapshot_path = snapshotPath
    config.ckb_uri = network.remote
    config.network_type = network.chain
    config.log_path = path.resolve(dataPath, 'mercury.log')
    config.listen_uri = `0.0.0.0:${MercuryService.PORT}`
    fs.writeFileSync(configPath, TOML.stringify(config))
    return configPath
  }

  async stop() {
    return new Promise<void>(_resolve => {
      const resolve = () => {
        this.mercury?.removeAllListeners()
        _resolve()
      }
      if (this.mercury) {
        logger.info('Mercury:\tkilling')
        this.mercury.once('close', () => resolve())
        this.mercury.kill()
        this.mercury = null
      } else {
        resolve()
      }
    })
  }

  start = async () => {
    const network = NetworksService.getInstance().getCurrent()
    await this.stop()
    logger.info('Mercury:\tstart...')
    const configPath = this.createConfig(network)

    this.mercury = spawn(MercuryService.getBinary(), ['-c', configPath, 'run'])
    this.mercury.stderr && this.mercury.stderr.on('data', data => {
      logger.error('Mercury:\trun fail:', data.toString())
      this.mercury = null
    })

    this.mercury.on('error', error => {
      logger.error('Mercury:\trun fail:', error)
      this.mercury = null
    })

    this.mercury.on('close', () => {
      logger.info('Mercury:\tprocess closed')
      this.mercury = null
    })
  }

  clearData = async () => {
    const network = NetworksService.getInstance().getCurrent()
    await this.stop()
    const dataPath = this.getDataPath(network)
    deleteFolderRecursive(dataPath)
  }

  static createFolder(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
