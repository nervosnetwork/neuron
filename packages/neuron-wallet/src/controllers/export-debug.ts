import os from 'os'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import { app, dialog } from 'electron'
import logger from '../utils/logger'
import { t } from 'i18next'
import NetworksService from '../services/networks'
import SyncedBlockNumber from '../models/synced-block-number'
import AddressService from '../services/addresses'
import redistCheck from '../utils/redist-check'
import SettingsService from '../services/settings'
import { generateRPC } from '../utils/ckb-rpc'
import { CKBLightRunner } from '../services/light-runner'
import { LIGHT_CLIENT_MAINNET, LIGHT_CLIENT_TESTNET } from '../utils/const'
import WalletsService from '../services/wallets'
import LogEncryption from '../services/log-encryption'

export default class ExportDebugController {
  #I18N_PATH = 'export-debug-info'
  #ANONYMOUS_ADDRESS = 'http://****:port'
  private archive: archiver.Archiver

  constructor() {
    this.archive = archiver('zip', {
      zlib: { level: 9 },
    })
    this.archive.on('error', err => {
      dialog.showErrorBox(t('common.error'), err.message)
    })
  }

  public async export() {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: t(`${this.#I18N_PATH}.export-debug-info`),
        defaultPath: `neuron_debug_${Date.now()}.zip`,
      })
      if (canceled || !filePath) {
        return
      }
      this.archive.pipe(fs.createWriteStream(filePath))
      await Promise.all([
        this.addStatusFile(),
        this.addBundledCKBLog(),
        this.addLogFiles(),
        this.addHdPublicKeyInfoCsv(),
        this.addBundledCKBLightClientLog(),
      ])
      await this.archive.finalize()
      dialog.showMessageBox({
        type: 'info',
        message: t(`${this.#I18N_PATH}.debug-info-exported`, { file: filePath }),
      })
    } catch (err) {
      dialog.showErrorBox(t('common.error'), err.message)
    }
  }

  private addStatusFile = async () => {
    const neuronVersion = app.getVersion()
    const network = NetworksService.getInstance().getCurrent()
    const rpcService = generateRPC(network.remote, network.type)

    const [syncedBlockNumber, ckbVersion, tipBlockNumber, peers, vcredist] = await Promise.all([
      new SyncedBlockNumber()
        .getNextBlock()
        .then(n => n.toString())
        .catch(() => ''),
      rpcService
        .localNodeInfo()
        .then(v => v.version)
        .catch(() => ''),
      rpcService
        .getTipBlockNumber()
        .then(n => BigInt(n).toString())
        .catch(() => ''),
      rpcService.getPeers().catch(() => []),
      redistCheck(),
    ])
    const { platform, arch } = process
    const release = os.release()
    const wallets = WalletsService.getInstance().getAll()
    const status = {
      neuron: {
        version: neuronVersion,
        blockNumber: syncedBlockNumber,
      },
      ckb: {
        url: /https?:\/\/(localhost|127.0.0.1)/.test(network.remote) ? network.remote : this.#ANONYMOUS_ADDRESS,
        version: ckbVersion,
        blockNumber: tipBlockNumber,
        peers,
      },
      client: {
        platform,
        arch,
        release,
        vcredist,
      },
      wallets: wallets.map((v, idx) => ({
        idx,
        startBlockNumber: v.startBlockNumber,
      })),
    }
    this.archive.append(JSON.stringify(status), {
      name: 'status.json',
    })
  }

  private readLastSizeOfFile(filepath: string, size = 32_000) {
    return new Promise<string>((resolve, reject) => {
      if (!fs.existsSync(filepath)) {
        return reject(new Error('File not found'))
      }

      const fileStats = fs.statSync(filepath)
      const position = fileStats.size - size

      fs.open(filepath, 'r', (openErr, fd) => {
        if (openErr) {
          return reject(openErr)
        }
        fs.read(fd, Buffer.alloc(size), 0, size, position, (readErr, _, buffer) => {
          fs.close(fd, closeErr => {
            const err = closeErr || readErr
            if (err) {
              return reject(err)
            }
            return resolve(buffer.toString('utf8'))
          })
        })
      })
    })
  }

  private addBundledCKBLog = async () => {
    const name = 'bundled-ckb.log'
    try {
      const logPath = path.resolve(SettingsService.getInstance().getNodeDataPath(), 'data', 'logs', 'run.log')
      const log = await this.readLastSizeOfFile(logPath)
      this.archive.append(log, { name })
    } catch (error) {
      this.archive.append(error.message, { name })
    }
  }

  private async addHdPublicKeyInfoCsv() {
    try {
      const addressMetas = await AddressService.getAddressesByAllWallets()
      const wallets = WalletsService.getInstance().getAll()
      const idToIdx = new Map<string, number>()
      wallets.forEach((v, idx) => idToIdx.set(v.id, idx))
      let csv = 'index,addressType,addressIndex,publicKeyInBlake160\n'
      for (const addressMeta of addressMetas) {
        const row = `${idToIdx.get(addressMeta.walletId) ?? addressMeta.walletId},${addressMeta.addressType},${
          addressMeta.addressIndex
        },${addressMeta.blake160}\n`
        csv += row
      }
      const csvFileName = 'hd_public_key_info.csv'
      const encryption = LogEncryption.getInstance()
      if (encryption.isEnabled) {
        this.archive.append(encryption.encrypt(csv), { name: `encrypted_${csvFileName}` })
      } else {
        this.archive.append(csv, { name: csvFileName })
      }
    } catch (error) {
      logger.error(`Export Debug:\t export public key info error: ${error}`)
    }
  }

  private addLogFiles = (files = ['main.log', 'renderer.log']) => {
    const logFile = logger.transports.file.getFile()
    if (!logFile?.path) {
      return
    }
    files.forEach(file => {
      this.archive.file(path.join(logFile.path, '..', file), { name: file })
    })
  }

  private async addBundledCKBLightClientLog() {
    const mainnetLogPath = CKBLightRunner.getInstance().getLogPath(LIGHT_CLIENT_MAINNET)
    if (fs.existsSync(mainnetLogPath)) {
      const mainnetLog = await this.readLastSizeOfFile(mainnetLogPath)
      this.archive.append(mainnetLog, { name: 'bundled-ckb-lignt-client-mainnet.log' })
    }
    const testnetLogPath = CKBLightRunner.getInstance().getLogPath(LIGHT_CLIENT_TESTNET)
    if (fs.existsSync(testnetLogPath)) {
      const testnetLog = await this.readLastSizeOfFile(testnetLogPath)
      this.archive.append(testnetLog, { name: 'bundled-ckb-lignt-client-testnet.log' })
    }
  }
}
