import fs from 'fs'
import path from 'path'
import { BI } from '@ckb-lumos/bi'
import { app as electronApp, dialog, shell, app } from 'electron'
import { t } from 'i18next'
import { interval, BehaviorSubject, merge } from 'rxjs'
import { distinctUntilChanged, sampleTime, flatMap, delay, retry, debounceTime } from 'rxjs/operators'
import env from '../env'
import { ConnectionStatusSubject } from '../models/subjects/node'
import { CurrentNetworkIDSubject } from '../models/subjects/networks'
import { NetworkType } from '../models/network'
import NetworksService from '../services/networks'
import RpcService from '../services/rpc-service'
import { startCkbNode, stopCkbNode } from '../services/ckb-runner'
import { START_WITHOUT_INDEXER } from '../utils/const'
import logger from '../utils/logger'
import redistCheck from '../utils/redist-check'
import { rpcRequest } from '../utils/rpc-request'
import { generateRPC } from '../utils/ckb-rpc'
import startMonitor, { stopMonitor } from './monitor'
import { CKBLightRunner } from './light-runner'

export enum VerifyCkbVersionResult {
  Same,
  Compatible,
  ShouldUpdate,
  Incompatible,
}

class NodeService {
  private static instance: NodeService

  static getInstance(): NodeService {
    if (!NodeService.instance) {
      NodeService.instance = new NodeService()
    }
    return NodeService.instance
  }

  public delayTime = 0
  public intervalTime = 1000
  public tipNumberSubject = new BehaviorSubject<string>('0')
  public connectionStatusSubject = new BehaviorSubject<boolean>(false)

  private _tipBlockNumber: string = '0'
  #startedBundledNode: boolean = false

  get startedBundledNode() {
    return this.#startedBundledNode
  }

  private constructor() {
    this.start()
    this.syncConnectionStatus()
    CurrentNetworkIDSubject.subscribe(this.whenNetworkUpdate)
  }

  public get tipBlockNumber(): string {
    return this._tipBlockNumber
  }

  public syncConnectionStatus = () => {
    const periodSync = this.connectionStatusSubject.pipe(sampleTime(10000))
    const realtimeSync = this.connectionStatusSubject.pipe(distinctUntilChanged())
    merge(periodSync, realtimeSync)
      .pipe(debounceTime(500))
      .subscribe(connected => {
        const currentNetwork = NetworksService.getInstance().getCurrent()
        const isBundledNode = currentNetwork.readonly
        ConnectionStatusSubject.next({
          url: currentNetwork.remote,
          connected,
          isBundledNode,
          startedBundledNode: isBundledNode ? this.#startedBundledNode : false,
        })
      })
  }

  private whenNetworkUpdate = () => {
    this.tipNumberSubject.next('0')
    this.connectionStatusSubject.next(false)
  }

  public start = () => {
    const { unsubscribe } = this.tipNumber()
    this.stop = unsubscribe
  }

  public stop: (() => void) | null = null

  public tipNumber = () => {
    return interval(this.intervalTime)
      .pipe(
        delay(this.delayTime),
        flatMap(() => {
          const currentNetwork = NetworksService.getInstance().getCurrent()
          return generateRPC(currentNetwork.remote, currentNetwork.type)
            .getTipBlockNumber()
            .then(tipNumber => {
              this.connectionStatusSubject.next(true)
              return tipNumber
            })
            .catch(err => {
              this.connectionStatusSubject.next(false)
              throw err
            })
        }),
        retry(3),
        distinctUntilChanged()
      )
      .subscribe(
        tipNumber => {
          if (!this.delayTime) {
            this.delayTime = 0
          }
          const tip: string = BI.from(tipNumber).toString()
          this._tipBlockNumber = tip
          this.tipNumberSubject.next(tip)
        },
        () => {
          if (this.delayTime < 10 * this.intervalTime) {
            this.delayTime = 2 * this.intervalTime
          }
          const { unsubscribe } = this.tipNumber()
          this.stop = unsubscribe
        }
      )
  }

  public async tryStartNodeOnDefaultURI() {
    const isDefaultCKBNeedStart = await this.isDefaultCKBNeedRestart()
    await stopMonitor('ckb')
    if (isDefaultCKBNeedStart) {
      logger.info('CKB:\texternal RPC on default uri not detected, starting bundled CKB node.')
      const redistReady = await redistCheck()
      await (redistReady ? this.startNode() : this.showGuideDialog())
      await startMonitor()
    } else {
      logger.info('CKB:\texternal RPC on default uri detected, skip starting bundled CKB node.')
    }
  }

  public async verifyExternalCkbNode() {
    logger.info('CKB:\tstart verify external ckb node')
    const network = NetworksService.getInstance().getCurrent()
    if (!network.readonly) {
      const localNodeInfo = await new RpcService(network.remote, network.type).localNodeInfo()
      const internalNodeVersion = this.getInternalNodeVersion()
      const neuronVersion = app.getVersion()
      if (!internalNodeVersion || !localNodeInfo.version) return
      return {
        ckbIsCompatible: this.isCkbCompatibility(neuronVersion, localNodeInfo.version),
        withIndexer: await this.isStartWithIndexer(),
        shouldUpdate: this.verifyCKbNodeShouldUpdate(internalNodeVersion, localNodeInfo.version),
      }
    }
  }

  public async isDefaultCKBNeedRestart() {
    const network = NetworksService.getInstance().getCurrent()
    if (!network.readonly) {
      return false
    }
    try {
      await new RpcService(network.remote, network.type).localNodeInfo()
      return false
    } catch (err) {
      return true
    }
  }

  public async startNode() {
    try {
      const network = NetworksService.getInstance().getCurrent()
      if (network.type === NetworkType.Light) {
        await stopCkbNode()
        await CKBLightRunner.getInstance().start()
      } else {
        await CKBLightRunner.getInstance().stop()
        await startCkbNode()
      }
      this.#startedBundledNode = true
    } catch (error) {
      this.#startedBundledNode = false
      logger.info('CKB:\tfail to start bundled CKB with error:')
      logger.error(error)
    }
  }

  public async startNodeIgnoreExternal() {
    logger.info('CKB:\tignore running external node, and start node with another port')
    await stopMonitor('ckb')
    const redistReady = await redistCheck()
    await (redistReady ? this.startNode() : this.showGuideDialog())
    await startMonitor()
  }

  private showGuideDialog = () => {
    const I18N_PATH = `messageBox.ckb-dependency`
    return dialog
      .showMessageBox({
        type: 'info',
        buttons: ['install-and-exit'].map(label => t(`${I18N_PATH}.buttons.${label}`)),
        defaultId: 0,
        title: t(`${I18N_PATH}.title`),
        message: t(`${I18N_PATH}.message`),
        detail: t(`${I18N_PATH}.detail`),
        cancelId: 0,
        noLink: true,
      })
      .then(() => {
        const VC_REDIST_URL = `https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads`
        shell.openExternal(VC_REDIST_URL)
        env.app.quit()
        return false
      })
  }

  private getInternalNodeVersion() {
    const appPath = electronApp.isPackaged ? electronApp.getAppPath() : path.join(__dirname, '../../../..')
    const ckbVersionPath = path.join(appPath, '.ckb-version')
    if (fs.existsSync(ckbVersionPath)) {
      try {
        return fs.readFileSync(ckbVersionPath, 'utf8')?.split('\n')?.[0]?.slice(1)
      } catch (err) {
        logger.error('App\t: get ckb node version failed')
      }
    }
  }

  private getNeuronCompatibilityCKB() {
    const appPath = electronApp.isPackaged ? electronApp.getAppPath() : path.join(__dirname, '../../../..')
    const compatiblePath = path.join(appPath, 'compatible.csv')
    if (fs.existsSync(compatiblePath)) {
      try {
        const content = fs.readFileSync(compatiblePath, 'utf8')?.split('\n')
        const ckbVersions = content?.[0]?.split(',')?.slice(1)
        const neuronCompatible = content?.slice(2)
        const result: Record<string, Record<string, boolean>> = {}
        for (let index = 0; index < neuronCompatible.length; index++) {
          const [neuronVersion, ...campatibleValues] = neuronCompatible[index].split(',')
          result[neuronVersion] = {}
          campatibleValues.forEach((v, idx) => {
            result[neuronVersion][ckbVersions[idx]] = v === 'yes'
          })
        }
        return result
      } catch (err) {
        logger.error('App\t: get compatible table failed')
      }
    }
  }

  private isCkbCompatibility(neuronVersion: string, externalCKBVersion: string) {
    const compatibilities = this.getNeuronCompatibilityCKB()
    const neuronCompatibleVersion = neuronVersion.split('.').slice(0, 2).join('.')
    const externalCKBCompatibleVersion = externalCKBVersion.split('.').slice(0, 2).join('.')
    return compatibilities?.[neuronCompatibleVersion]?.[externalCKBCompatibleVersion]
  }

  private verifyCKbNodeShouldUpdate(neuronCKBVersion: string, externalCKBVersion: string) {
    const [internalMajor, internalMinor] = neuronCKBVersion.split('.')?.map(v => +v) ?? []
    const [externalMajor, externalMinor] = externalCKBVersion.split('.')?.map(v => +v) ?? []
    return internalMajor < externalMajor || (internalMajor === externalMajor && internalMinor < externalMinor)
  }

  private async isStartWithIndexer() {
    const network = NetworksService.getInstance().getCurrent()
    try {
      const res = await rpcRequest<{ error?: { code: number } }>(network.remote, { method: 'get_indexer_tip' })
      if (res.error?.code === START_WITHOUT_INDEXER) {
        logger.info('Node:\tthe ckb node does not start with --indexer')
        return false
      }
      return true
    } catch (error) {
      logger.info('Node:\tcalling get_indexer_tip failed')
      return false
    }
  }
}

export default NodeService
