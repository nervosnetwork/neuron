import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import env from '../env'
import logger from '../utils/logger'
import SettingsService from '../services/settings'
import { clean } from '../database/chain'
import { resetSyncTaskQueue } from '../block-sync-renderer'
import { getUsablePort } from '../utils/get-usable-port'
import { updateToml } from '../utils/toml'
import { BUNDLED_URL_PREFIX, LIGHT_CLIENT_MAINNET } from '../utils/const'
import NetworksService from './networks'

const { app } = env

export enum NetworkType {
  Light,
  Full,
}

abstract class NodeRunner {
  protected constructor() {}
  protected abstract networkType: NetworkType
  protected runnerProcess: ChildProcess | undefined
  protected static instance: NodeRunner | undefined
  protected abstract binaryName: string
  protected abstract _port: number
  static getInstance(): NodeRunner {
    throw new Error('should be called by concrete class')
  }

  abstract start(): Promise<void>

  protected get binary() {
    const appPath = app.isPackaged
      ? path.join(path.dirname(app.getAppPath()), '..', './bin')
      : path.join(__dirname, '../../bin')
    const binary = app.isPackaged
      ? path.resolve(appPath, `./${this.binaryName}`)
      : path.resolve(appPath, `./${this.platform()}`, `./${this.binaryName}`)
    return this.platform() === 'win' ? binary + '.exe' : binary
  }

  get port() {
    return this._port
  }

  get nodeUrl() {
    return `${BUNDLED_URL_PREFIX}${this._port}`
  }

  platform(): string {
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

  async stop() {
    return new Promise<void>(resolve => {
      if (this.runnerProcess) {
        logger.info('Runner:\tkilling node')
        this.runnerProcess.once('close', () => resolve())
        this.runnerProcess.kill()
        this.runnerProcess = undefined
      } else {
        resolve()
      }
    })
  }
}

export class CKBLightRunner extends NodeRunner {
  protected networkType: NetworkType = NetworkType.Light
  protected binaryName: string = 'ckb-light-client'
  protected logStream?: fs.WriteStream
  protected _port: number = 9000

  static getInstance(): CKBLightRunner {
    if (!CKBLightRunner.instance) {
      CKBLightRunner.instance = new CKBLightRunner()
    }
    return CKBLightRunner.instance as CKBLightRunner
  }

  private get templateConfigFile() {
    const appPath = app.isPackaged
      ? path.join(path.dirname(app.getAppPath()), '..', './light')
      : path.join(__dirname, '../../light')
    const network = NetworksService.getInstance().getCurrent()
    return path.resolve(
      appPath,
      network.chain === LIGHT_CLIENT_MAINNET ? 'ckb_light_mainnet.toml' : './ckb_light_testnet.toml'
    )
  }

  private get configFile() {
    return path.resolve(SettingsService.getInstance().getNodeDataPath(), './ckb_light.toml')
  }

  initConfig() {
    if (fs.existsSync(this.configFile)) {
      logger.info(`CKB Light Runner:\tconfig has init, skip init...`)
      return
    }
    if (!fs.existsSync(SettingsService.getInstance().getNodeDataPath())) {
      fs.mkdirSync(SettingsService.getInstance().getNodeDataPath(), { recursive: true })
    }
    fs.copyFileSync(this.templateConfigFile, this.configFile)
  }

  async updateConfig() {
    const usablePort = await getUsablePort(this._port)
    this._port = usablePort
    const storePath = path.join(SettingsService.getInstance().getNodeDataPath(), './store')
    const networkPath = path.join(SettingsService.getInstance().getNodeDataPath(), './network')
    updateToml(this.configFile, {
      store: `path = "${this.platform() === 'win' ? storePath.replace('\\', '\\\\') : storePath}"`,
      network: `path = "${this.platform() === 'win' ? networkPath.replace('\\', '\\\\') : storePath}"`,
      rpc: `listen_address = "127.0.0.1:${usablePort}"`,
    })
  }

  async start() {
    if (this.runnerProcess) {
      logger.info(`CKB Light Runner:\tckb light is not closed, close it before start...`)
      await this.stop()
    }
    this.initConfig()
    await this.updateConfig()

    const options = ['run', '--config-file', this.configFile]
    logger.info(`CKB Light Runner:\tckb light node will start with rpc port ${this._port}, with options`, options)
    const runnerProcess = spawn(this.binary, options, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { RUST_LOG: 'info', ckb_light_client: 'info' },
    })
    this.runnerProcess = runnerProcess

    if (!this.logStream) {
      this.logStream = fs.createWriteStream(this.logPath)
    }

    runnerProcess.stderr &&
      runnerProcess.stderr.on('data', data => {
        const dataString: string = data.toString()
        logger.error('CKB Light Runner:\trun fail:', dataString)
        this.logStream?.write(data)
      })

    runnerProcess.stdout &&
      runnerProcess.stdout.on('data', data => {
        this.logStream?.write(data)
      })
    runnerProcess.on('error', error => {
      logger.error('CKB Light Runner:\trun fail:', error)
      this.runnerProcess = undefined
    })

    runnerProcess.on('close', () => {
      logger.info('CKB Light Runner:\tprocess closed')
      this.runnerProcess = undefined
    })
  }

  get logPath() {
    return path.join(logger.transports.file.getFile().path, '..', 'light_client_run.log')
  }

  async clearNodeCache(): Promise<void> {
    await this.stop()
    fs.rmSync(SettingsService.getInstance().getNodeDataPath(), { recursive: true, force: true })
    await clean(true)
    await this.start()
    resetSyncTaskQueue.asyncPush(true)
  }
}
