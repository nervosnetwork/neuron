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

abstract class CKBRunner {
  protected constructor() {}
  protected abstract networkType: NetworkType
  protected runnerProces: ChildProcess | undefined
  protected static instance: CKBRunner | undefined
  static getInstance(): CKBRunner {
    throw new Error('should be called by instance')
  }

  abstract get ckbBinary(): string
  abstract start(): Promise<void>
  abstract stop(): Promise<void>
  abstract isLiving(): Promise<boolean>
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
}

export class CKBLightRunner extends CKBRunner {
  protected networkType: NetworkType = NetworkType.Full

  static getInstance(): CKBLightRunner {
    if (!CKBLightRunner.instance) {
      CKBLightRunner.instance = new CKBLightRunner()
    }
    return CKBLightRunner.instance as CKBLightRunner
  }

  get ckbBinary() {
    const appPath = app.isPackaged
      ? path.join(path.dirname(app.getAppPath()), '..', './bin')
      : path.join(__dirname, '../../bin')
    const binary = app.isPackaged
      ? path.resolve(appPath, './ckb-light-client')
      : path.resolve(appPath, `./${this.platform()}`, './ckb-light-client')
    return this.platform() === 'win' ? binary + '.exe' : binary
  }

  get templateConfigFile() {
    const appPath = app.isPackaged
      ? path.join(path.dirname(app.getAppPath()), '..', './light')
      : path.join(__dirname, '../../light')
    return path.resolve(appPath, './ckb_light.toml')
  }

  get configFile() {
    return path.resolve(SettingsService.getInstance().lightDataPath, './ckb_light.toml')
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
        return `path = "${path.join(SettingsService.getInstance().lightDataPath, './store')}"`
      }
      if (isNetworkPath) {
        isNetworkPath = false
        return `path = "${path.join(SettingsService.getInstance().lightDataPath, './network')}"`
      }
      if (v === '[store]') {
        isStorePath = true
      } else if (v === '[network]') {
        isNetworkPath = true
      }
      return v
    })
    if (!fs.existsSync(SettingsService.getInstance().lightDataPath)) {
      fs.mkdirSync(SettingsService.getInstance().lightDataPath, { recursive: true })
    }
    fs.writeFileSync(this.configFile, newValues.join('\n'))
  }

  async start() {
    if (this.runnerProces) {
      logger.info(`CKBLightRunner:\tckb is not closed, close it before start...`)
      await this.stop()
    }
    this.initConfig()

    const options = ['run', '--config-file', this.configFile]
    const runnerProcess = spawn(this.ckbBinary, options, { stdio: ['ignore', 'pipe', 'pipe'] })
    this.runnerProces = runnerProcess

    runnerProcess.stderr &&
      runnerProcess.stderr.on('data', data => {
        const dataString: string = data.toString()
        logger.error('CKBLightRunner:\trun fail:', dataString)
        this.runnerProces = undefined
      })

    runnerProcess.on('error', error => {
      logger.error('CKBLightRunner:\trun fail:', error)
      this.runnerProces = undefined
    })

    runnerProcess.on('close', () => {
      logger.info('CKBLightRunner:\tprocess closed')
      this.runnerProces = undefined
    })
    resetSyncTaskQueue.push(true)
  }

  async stop() {
    return new Promise<void>(resolve => {
      if (this.runnerProces) {
        logger.info('CKBLightRunner:\tkilling node')
        this.runnerProces.once('close', () => resolve())
        this.runnerProces.kill('SIGKILL')
        this.runnerProces = undefined
      } else {
        resolve()
      }
    })
  }

  async isLiving() {
    return false
  }
}
