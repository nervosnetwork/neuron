import env from 'env'
import path from 'path'
import fs from 'fs'
import { ChildProcess, spawn } from 'child_process'
import logger from 'utils/logger'
import { resetSyncTaskQueue } from 'block-sync-renderer'
import SettingsService from 'services/settings'

const { app } = env

export enum NetworkType {
  Light,
  Full
}

abstract class NodeRunner {
  protected constructor() {}
  protected abstract networkType: NetworkType
  protected runnerProcess: ChildProcess | undefined
  protected static instance: NodeRunner | undefined
  static getInstance(): NodeRunner {
    throw new Error('should be called by instance')
  }

  protected abstract get binary(): string
  abstract start(): Promise<void>
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
      resetSyncTaskQueue.push(false)
      if (this.runnerProcess) {
        logger.info('Runner:\tkilling node')
        this.runnerProcess.once('close', () => resolve())
        this.runnerProcess.kill('SIGKILL')
        this.runnerProcess = undefined
      } else {
        resolve()
      }
    })
  }
}

export class CKBLightRunner extends NodeRunner {
  protected networkType: NetworkType = NetworkType.Full

  static getInstance(): CKBLightRunner {
    if (!CKBLightRunner.instance) {
      CKBLightRunner.instance = new CKBLightRunner()
    }
    return CKBLightRunner.instance as CKBLightRunner
  }

  protected get binary() {
    const appPath = app.isPackaged
      ? path.join(path.dirname(app.getAppPath()), '..', './bin')
      : path.join(__dirname, '../../bin')
    const binary = app.isPackaged
      ? path.resolve(appPath, './ckb-light-client')
      : path.resolve(appPath, `./${this.platform()}`, './ckb-light-client')
    return this.platform() === 'win' ? binary + '.exe' : binary
  }

  private get templateConfigFile() {
    const appPath = app.isPackaged
      ? path.join(path.dirname(app.getAppPath()), '..', './light')
      : path.join(__dirname, '../../light')
    return path.resolve(appPath, './ckb_light.toml')
  }

  private get configFile() {
    return path.resolve(SettingsService.getInstance().testnetLightDataPath, './ckb_light.toml')
  }

  initConfig() {
    if (fs.existsSync(this.configFile)) {
      logger.info(`CKBLightRunner:\tconfig has init, skip init...`)
      return
    }
    const values = fs
      .readFileSync(this.templateConfigFile)
      .toString()
      .split('\n')
    let isStorePath = false
    let isNetworkPath = false
    const newValues = values.map(v => {
      if (isStorePath) {
        isStorePath = false
        return `path = "${path.join(SettingsService.getInstance().testnetLightDataPath, './store')}"`
      }
      if (isNetworkPath) {
        isNetworkPath = false
        return `path = "${path.join(SettingsService.getInstance().testnetLightDataPath, './network')}"`
      }
      if (v === '[store]') {
        isStorePath = true
      } else if (v === '[network]') {
        isNetworkPath = true
      }
      return v
    })
    if (!fs.existsSync(SettingsService.getInstance().testnetLightDataPath)) {
      fs.mkdirSync(SettingsService.getInstance().testnetLightDataPath, { recursive: true })
    }
    fs.writeFileSync(this.configFile, newValues.join('\n'))
  }

  async start() {
    if (this.runnerProcess) {
      logger.info(`CKBLightRunner:\tckb is not closed, close it before start...`)
      await this.stop()
    }
    this.initConfig()

    const options = ['run', '--config-file', this.configFile]
    const runnerProcess = spawn(this.binary, options, { stdio: ['ignore', 'pipe', 'pipe'] })
    this.runnerProcess = runnerProcess

    runnerProcess.stderr &&
      runnerProcess.stderr.on('data', data => {
        const dataString: string = data.toString()
        logger.error('CKBLightRunner:\trun fail:', dataString)
        this.runnerProcess = undefined
      })

    runnerProcess.on('error', error => {
      logger.error('CKBLightRunner:\trun fail:', error)
      this.runnerProcess = undefined
    })

    runnerProcess.on('close', () => {
      logger.info('CKBLightRunner:\tprocess closed')
      this.runnerProcess = undefined
    })
    resetSyncTaskQueue.push(true)
  }
}
