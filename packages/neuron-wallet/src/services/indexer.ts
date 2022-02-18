import env from 'env'
import path from 'path'
import fs from 'fs'
import net from 'net'
import { ChildProcess, spawn } from 'child_process'
import process from 'process'
import { dialog } from 'electron'
import logger from 'utils/logger'
import { Network } from 'models/network'
import SyncedBlockNumber from 'models/synced-block-number'
import NetworksService from './networks'
import CommonUtils from 'utils/common'
import { resetSyncTask } from 'block-sync-renderer'
import { clean as cleanChain } from 'database/chain'

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

export default class IndexerService {
  private indexer: ChildProcess | null = null
  private static instance: IndexerService
  private static indexerDataFolder = 'ckb_indexer_data'
  public static PORT = '8118'
  public static get LISTEN_URI() {
    return `http://localhost:${IndexerService.PORT}`
  }

  static getInstance = () => {
    if (!IndexerService.instance) {
      IndexerService.instance = new IndexerService()
    }
    return IndexerService.instance
  }

  static getPath = (): string => {
    return app.isPackaged ?
      path.join(path.dirname(app.getAppPath()), '..', 'bin') :
      path.join(__dirname, '../../bin',)
  }

  static getBinary = (): string => {
    const binary = app.isPackaged ?
      path.resolve(IndexerService.getPath(), 'ckb-indexer') :
      path.resolve(IndexerService.getPath(), `${platform()}`, 'ckb-indexer')
    return platform() === 'win' ? binary + '.exe' : binary
  }

  static ensurePortUsable = async () => {
    const port = Number(IndexerService.PORT)
    const isPortReachable = await IndexerService.isPortReachable(port)
    if (!isPortReachable) {
      return
    }
    IndexerService.PORT = (port + 1).toString()
    await IndexerService.ensurePortUsable()
  }

  static clearCache = async (clearIndexerFolder = false) => {
    await resetSyncTask(false)
    await cleanChain()

    if (clearIndexerFolder) {
      IndexerService.getInstance().clearData()
      await new SyncedBlockNumber().setNextBlock(BigInt(0))
    }

    await resetSyncTask(true)
  }

  static createFolder(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  static isPortReachable = async (port: number) => {
    const timeout = 1e3
    const host = '127.0.0.1'
    const promise = new Promise<void>((resolve, reject) => {
      const socket = new net.Socket()

      const onError = () => {
        socket.destroy()
        reject()
      }

      socket.setTimeout(timeout)
      socket.once('error', onError)
      socket.once('timeout', onError)

      socket.connect(port, host, () => {
        socket.end()
        resolve()
      })
    })

    try {
      await promise
      return true
    } catch (_) {
      return false
    }
  }

  stop = async () => {
    const _indexer = this.indexer

    if (!_indexer) { return }
    logger.debug(`Indexer:\tstopping`)
    // _indexer.removeAllListeners()
    await new Promise((resolve, reject) => {
      _indexer.once('close', code => {
        return code ? reject(code) : resolve(code)
      })
      _indexer.kill()
    }).catch(() => null)
  }

  start = async () => {
    if (this.indexer) {
      return
    }
    const network = NetworksService.getInstance().getCurrent()
    const dataPath = this.#getDataPath(network)
    IndexerService.createFolder(dataPath)
    await IndexerService.ensurePortUsable()

    try {
      const bin = IndexerService.getBinary()
      const params = ['-c', network.remote, '-s', dataPath, '-l', `127.0.0.1:${IndexerService.PORT}`]
      const indexer = spawn(bin, params)
      this.indexer = indexer
      logger.info(`Indexer:\tstart: PORT: ${IndexerService.PORT}...`)

      indexer.stderr && indexer.stderr.on('data', async data => {
        logger.debug(`Indexer stderr:\t`, data.toString())
      })

      indexer.on('error', (error: any) => {
        logger.error('Indexer error:\t:', error.toString())
        CommonUtils.sleep(3000)
        this.start()
      })

      indexer.on('exit', () => {
        logger.debug(`Indexer:\tstopped`)
        this.indexer = null
      })


    } catch (err) {
      logger.error(err)
      dialog.showErrorBox("CKB Indexer", err.message)
    }


    // REFACTOR: use message to return the promise
    while (!(await IndexerService.isPortReachable(+IndexerService.PORT))) {
      await CommonUtils.sleep(1000)
    }
  }

  clearData = () => {
    const network = NetworksService.getInstance().getCurrent()
    const dataPath = this.#getDataPath(network)
    logger.debug(`Removing data ${dataPath}`)
    fs.rmSync(dataPath, { recursive: true, force: true })

    // remove legacy data
    fs.rmSync(path.resolve(env.fileBasePath, 'indexer_data', network.genesisHash), { recursive: true, force: true })
  }



  #getDataPath = (network: Network): string => {
    return path.resolve(env.fileBasePath, IndexerService.indexerDataFolder, 'data', `${network.genesisHash}`)
  }
}
