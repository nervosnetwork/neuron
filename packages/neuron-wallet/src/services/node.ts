import fs from 'fs'
import path from 'path'
import { BI } from '@ckb-lumos/lumos'
import { app as electronApp, dialog, shell, app } from 'electron'
import { t } from 'i18next'
import { interval, BehaviorSubject, merge, Subject } from 'rxjs'
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
import SettingsService from './settings'

export enum VerifyCkbVersionResult {
  Same,
  Compatible,
  ShouldUpdate,
  Incompatible,
}

type CKBNodeType = 'full' | 'light'

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

  #startNodeSubject = new Subject<void>()
  private _tipBlockNumber: string = '0'
  #startedBundledNode: boolean = false

  get startedBundledNode() {
    return this.#startedBundledNode
  }

  private constructor() {
    this.start()
    this.syncConnectionStatus()
    CurrentNetworkIDSubject.subscribe(this.whenNetworkUpdate)
    this.#startNodeSubject.pipe(debounceTime(1000)).subscribe(this.startNode)
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
    this.stop?.()
    this.#startedBundledNode = false
    this.tipNumberSubject.next('0')
    this.connectionStatusSubject.next(false)
  }

  public start = () => {
    this.stop?.()
    const subscribe = this.tipNumber()
    this.stop = subscribe.unsubscribe.bind(subscribe)
  }

  public stop?: () => void

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
          this.start()
        }
      )
  }

  public async tryStartNodeOnDefaultURI() {
    await stopMonitor('ckb')
    const isDefaultCKBNeedStart = await this.isDefaultCKBNeedRestart()
    if (isDefaultCKBNeedStart) {
      const currentNetwork = NetworksService.getInstance().getCurrent()
      if (SettingsService.getInstance().isFirstSync && currentNetwork.type === NetworkType.Default) {
        logger.info("CKB:\tThis is the first sync, please wait for the user's confirmation")
        return
      }
      logger.info('CKB:\texternal RPC on default uri not detected, starting bundled CKB node.')
      const redistReady = await redistCheck()
      await (redistReady ? this.#startNodeSubject.next() : this.showGuideDialog())
      await startMonitor()
    } else {
      logger.info('CKB:\texternal RPC on default uri detected, skip starting bundled CKB node.')
    }
    this.start()
  }

  public async verifyExternalCkbNode() {
    logger.info('CKB:\tstart verify external ckb node')
    const network = NetworksService.getInstance().getCurrent()
    if (!network.readonly) {
      const localNodeInfo = await new RpcService(network.remote, network.type).localNodeInfo()
      const type: CKBNodeType = network.type === NetworkType.Light ? 'light' : 'full'
      const internalNodeVersion = this.getInternalNodeVersion(type)
      const neuronVersion = app.getVersion()
      if (!internalNodeVersion || !localNodeInfo.version) return
      return {
        ckbIsCompatible: this.isCkbCompatibility(neuronVersion, localNodeInfo.version, type),
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

  public startNode = async () => {
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
    this.start()
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

  private getInternalNodeVersion(type: CKBNodeType) {
    const appPath = electronApp.isPackaged ? electronApp.getAppPath() : path.join(__dirname, '../../../..')
    const ckbVersionPath = path.join(appPath, type === 'light' ? '.ckb-light-version' : '.ckb-version')
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
    const compatiblePath = path.join(appPath, 'compatible.json')
    if (fs.existsSync(compatiblePath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const content = require(compatiblePath)
        return (content?.compatible ?? {}) as Record<
          string,
          {
            full: string[]
            light: string[]
          }
        >
      } catch (err) {
        logger.error('App\t: get compatible failed', err)
      }
    }
  }

  private isCkbCompatibility(neuronVersion: string, externalCKBVersion: string, type: CKBNodeType = 'full') {
    const compatibilities = this.getNeuronCompatibilityCKB()
    const neuronCompatibleVersion = neuronVersion.split('.').slice(0, 2).join('.')
    const externalCKBCompatibleVersion = externalCKBVersion.split('.').slice(0, 2).join('.')
    return compatibilities?.[neuronCompatibleVersion]?.[type]?.includes(externalCKBCompatibleVersion)
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
