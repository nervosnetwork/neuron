import env from 'env'
import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import process from 'process'
import logger from 'utils/logger'
import { Network } from 'models/network'
import TOML from '@iarna/toml'
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
    return app.isPackaged ?
      path.resolve(app.getPath('userData'), './mercury', './data', `./${network.genesisHash}`) :
      path.resolve(app.getPath('userData'), './dev', './mercury', './data', `./${network.genesisHash}`)
  }

  getConfigPath = (network: Network): string => {
    return app.isPackaged ?
      path.resolve(app.getPath('userData'), './mercury', './config', `./${network.id}`) :
      path.resolve(app.getPath('userData'), './dev', './mercury', './config', `./${network.id}`)
  }

  createConfig = (network: Network) => {
    const dataPath = this.getDataPath(network)
    const configPath = this.getConfigPath(network)
    const configFile = path.resolve(configPath, 'config.toml')
    if (fs.existsSync(configFile)) {
      return configFile
    }
    MercuryService.createFolder(configPath)
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
    fs.writeFileSync(configFile, TOML.stringify(config))
    return configFile
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
    const lumosIndexerDBFolder = 'indexer_data'
    const genesisBlockHash = NetworksService.getInstance().getCurrent().genesisHash
    const indexedDataFolderPath = path.resolve(
      env.fileBasePath,
      lumosIndexerDBFolder,
      genesisBlockHash
    )

    fs.rmSync(indexedDataFolderPath, { recursive: true, force: true })
  }

  static createFolder(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
