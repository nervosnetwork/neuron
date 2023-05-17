import fs from 'fs'
import path from 'path'
import { app as electronApp, dialog, shell } from 'electron'
import { t } from 'i18next'
import { interval, BehaviorSubject, merge } from 'rxjs'
import { distinctUntilChanged, sampleTime, flatMap, delay, retry, debounceTime } from 'rxjs/operators'
import env from '../env'
import { ShouldBeTypeOf } from '../exceptions'
import { ConnectionStatusSubject } from '../models/subjects/node'
import { CurrentNetworkIDSubject } from '../models/subjects/networks'
import { NetworkType } from '../models/network'
import NetworksService from '../services/networks'
import RpcService from '../services/rpc-service'
import { startCkbNode, stopCkbNode } from '../services/ckb-runner'
import { BUNDLED_CKB_URL, START_WITHOUT_INDEXER, BUNDLED_LIGHT_CKB_URL } from '../utils/const'
import logger from '../utils/logger'
import redistCheck from '../utils/redist-check'
import { rpcRequest } from '../utils/rpc-request'
import { generateRPC } from '../utils/ckb-rpc'
import HexUtils from '..//utils/hex'
import startMonitor from './monitor'
import { CKBLightRunner } from './light-runner'

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
  private startedBundledNode: boolean = false
  private _isCkbNodeExternal: boolean = false
  #nodeUrl: string = ''

  private constructor() {
    this.start()
    this.syncConnectionStatus()
    CurrentNetworkIDSubject.subscribe(async ({ currentNetworkID }) => {
      const currentNetwork = NetworksService.getInstance().get(currentNetworkID)
      if (currentNetwork) {
        this.setNetwork(currentNetwork.remote)
      }
    })
  }

  get nodeUrl() {
    return this.#nodeUrl
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
        const isBundledNode = this.#nodeUrl === BUNDLED_CKB_URL
        ConnectionStatusSubject.next({
          url: this.#nodeUrl,
          connected,
          isBundledNode,
          startedBundledNode: isBundledNode ? this.startedBundledNode : false,
        })
      })
  }

  private setNetwork = (url: string) => {
    if (typeof url !== 'string') {
      throw new ShouldBeTypeOf('URL', 'string')
    }
    if (!url.startsWith('http')) {
      throw new Error('Protocol of url should be specified')
    }
    this.#nodeUrl = url
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
          return generateRPC(this.#nodeUrl)
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
          const tip: string = HexUtils.toDecimal(tipNumber)
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
    if (isDefaultCKBNeedStart) {
      logger.info('CKB:\texternal RPC on default uri not detected, starting bundled CKB node.')
      const redistReady = await redistCheck()
      await (redistReady ? this.startNode() : this.showGuideDialog())
      await startMonitor()
    } else {
      logger.info('CKB:\texternal RPC on default uri detected, skip starting bundled CKB node.')
      this._isCkbNodeExternal = true
      await this.verifyNodeVersion()
      await this.verifyStartWithIndexer()
    }
  }

  public async isDefaultCKBNeedRestart() {
    let network = NetworksService.getInstance().getCurrent()
    if (network.remote !== BUNDLED_CKB_URL && network.remote !== BUNDLED_LIGHT_CKB_URL) {
      return false
    }
    try {
      await new RpcService(network.remote).localNodeInfo()
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
      this.startedBundledNode = true
    } catch (error) {
      this.startedBundledNode = false
      logger.info('CKB:\tfail to start bundled CKB with error:')
      logger.error(error)
    }
  }

  get isCkbNodeExternal() {
    return this._isCkbNodeExternal
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

  private async verifyNodeVersion() {
    const network = NetworksService.getInstance().getCurrent()
    const localNodeInfo = await new RpcService(network.remote).localNodeInfo()
    const internalNodeVersion = this.getInternalNodeVersion()
    const [internalMajor, internalMinor] = internalNodeVersion?.split('.') ?? []
    const [externalMajor, externalMinor] = localNodeInfo.version?.split('.') ?? []

    if (internalMajor !== externalMajor || (externalMajor === '0' && internalMinor !== externalMinor)) {
      dialog.showMessageBox({
        type: 'warning',
        message: t('messageBox.node-version-different.message', { version: internalNodeVersion }),
      })
    }
  }

  private async verifyStartWithIndexer() {
    const network = NetworksService.getInstance().getCurrent()
    try {
      const res = await rpcRequest<{ error?: { code: number } }>(network.remote, { method: 'get_indexer_tip' })
      if (res.error?.code === START_WITHOUT_INDEXER) {
        logger.info('Node:\tthe ckb node does not start with --indexer')
        dialog.showMessageBox({
          type: 'warning',
          message: t('messageBox.ckb-without-indexer.message'),
        })
      }
    } catch (error) {
      logger.info('Node:\tcalling get_indexer_tip failed')
      dialog.showMessageBox({
        type: 'warning',
        message: t('messageBox.ckb-without-indexer.message'),
      })
    }
  }
}

export default NodeService
