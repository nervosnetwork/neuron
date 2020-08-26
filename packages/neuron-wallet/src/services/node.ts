import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import https from 'https'
import http from 'http'
import { dialog, shell } from 'electron'
import { t } from 'i18next'
import CKB from '@nervosnetwork/ckb-sdk-core'
import { interval, BehaviorSubject, merge } from 'rxjs'
import { distinctUntilChanged, sampleTime, flatMap, delay, retry, debounceTime } from 'rxjs/operators'
import env from 'env'
import { ShouldBeTypeOf } from 'exceptions'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { CurrentNetworkIDSubject } from 'models/subjects/networks'
import NetworksService from 'services/networks'
import RpcService from 'services/rpc-service'
import { startCkbNode } from 'services/ckb-runner'
import HexUtils from 'utils/hex'
import { BUNDLED_CKB_URL } from 'utils/const'
import logger from 'utils/logger'

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

  public ckb: CKB = new CKB('')

  constructor () {
    this.start()
    this.syncConnectionStatus()
    CurrentNetworkIDSubject.subscribe(async ({ currentNetworkID }) => {
      const currentNetwork = NetworksService.getInstance().get(currentNetworkID)
      if (currentNetwork) {
        this.setNetwork(currentNetwork.remote)
      }
    })
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
        ConnectionStatusSubject.next({
          url: this.ckb.node.url,
          connected,
        })
      })
  }

  public setNetwork = (url: string) => {
    if (typeof url !== 'string') {
      throw new ShouldBeTypeOf('URL', 'string')
    }
    if (!url.startsWith('http')) {
      throw new Error('Protocol of url should be specified')
    }
    if (url.startsWith('https')) {
      const httpsAgent = new https.Agent({ keepAlive: true })
      this.ckb.setNode({ url, httpsAgent })
    } else {
      const httpAgent = new http.Agent({ keepAlive: true })
      this.ckb.setNode({ url, httpAgent })
    }
    this.tipNumberSubject.next('0')
    this.connectionStatusSubject.next(false)
    return this.ckb
  }

  public start = () => {
    const { unsubscribe } = this.tipNumber()
    this.stop = unsubscribe
  }

  public stop: Function | null = null

  public tipNumber = () => {
    return interval(this.intervalTime)
      .pipe(
        delay(this.delayTime),
        flatMap(() => {
          return this.ckb.rpc
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

  public async tryStartNodeOnDefaultURI(): Promise<boolean> {
    let network = NetworksService.getInstance().getCurrent()
    if (network.remote !== BUNDLED_CKB_URL) {
      return false
    }
    try {
      await new RpcService(network.remote).getChain()
      logger.info('CKB:\texternal RPC on default uri detected, skip starting bundled CKB node.')
      return false
    } catch (err) {
      logger.info('CKB:\texternal RPC on default uri not detected, starting bundled CKB node.')
      const isReadyToStart = await this.detectDependency()
      return isReadyToStart ? this.startNode() : this.showGuideDialog()
    }
  }

  private showGuideDialog = () => {
    const I18N_PATH = `messageBox.ckb-dependency`
    return dialog.showMessageBox({
      type: 'info',
      buttons: ['skip', 'install-and-exit'].map(label => t(`${I18N_PATH}.buttons.${label}`)),
      defaultId: 1,
      title: t(`${I18N_PATH}.title`),
      message: t(`${I18N_PATH}.message`),
      detail: t(`${I18N_PATH}.detail`),
      cancelId: 0,
      noLink: true,
    }).then(({ response }) => {
      switch (response) {
        case 1: {
          // open browser and shutdown
          const VC_REDIST_URL = `https://support.microsoft.com/en-us/help/2977003/the-latest-supported-visual-c-downloads`
          shell.openExternal(VC_REDIST_URL)
          env.app.quit()
          return false
        }
        case 0:
        default: {
          // dismiss dialog and continue
          return this.startNode()
        }
      }
    })
  }

  private detectDependency = async () => {
    if (process.platform !== 'win32') {
      return true
    }
    const execPromise = promisify(exec)
    const arches = process.arch === 'x64' ? ['x86', 'x64'] : ['x64']
    const queries = arches.map(arch =>
      `REG QUERY ` +
      [`HKEY_LOCAL_MACHINE`, `SOFTWARE`, `Microsoft`, `VisualStudio`, `14.0`, `VC`, `Runtimes`, arch].join(path.sep))
    const vcredists = await Promise.all(
      queries.map(
        query => execPromise(query)
          .then(({ stdout }) => !!stdout)
          .catch(() => false)
      )
    )
    return vcredists.includes(true)
  }

  private startNode = () => {
    return startCkbNode().then(() => true).catch(err => {
      logger.info('CKB:\tfail to start bundled CKB with error:')
      logger.error(err)
      return false
    })
  }
}

export default NodeService
