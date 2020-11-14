import os from 'os'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import CKB from '@nervosnetwork/ckb-sdk-core'
import { app, dialog } from 'electron'
import logger from 'utils/logger'
import { t } from 'i18next'
import { ckbDataPath } from 'services/ckb-runner'
import NetworksService from 'services/networks'
import SyncedBlockNumber from 'models/synced-block-number'
import AddressService from 'services/addresses'

export default class ExportDebugController {
  #I18N_PATH = 'export-debug-info'
  #ANONYMOUS_ADDRESS = 'http://****:port'
  private archive: archiver.Archiver

  constructor() {
    this.archive = archiver('zip', {
      zlib: { level: 9 }
    })
    this.archive.on('error', err => {
      dialog.showErrorBox(t('common.error'), err.message)
    })
  }

  public async export() {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: t(`${this.#I18N_PATH}.export-debug-info`),
        defaultPath: `neuron_debug_${Date.now()}.zip`
      })
      if (canceled || !filePath) {
        return
      }
      this.archive.pipe(fs.createWriteStream(filePath))
      await Promise.all([this.addStatusFile(), this.addBundledCKBLog(), this.addLogFiles(), this.addHdPublicKeyInfoCsv()])
      await this.archive.finalize()
      dialog.showMessageBox({
        type: 'info',
        message: t(`${this.#I18N_PATH}.debug-info-exported`, { file: filePath })
      })
    } catch (err) {
      dialog.showErrorBox(t('common.error'), err.message)
    }
  }

  private addStatusFile = async () => {
    const neuronVersion = app.getVersion()
    const url = NetworksService.getInstance().getCurrent().remote
    const ckb = new CKB(url)

    const [syncedBlockNumber, ckbVersion, tipBlockNumber, peers] = await Promise.all([
      new SyncedBlockNumber()
        .getNextBlock()
        .then(n => n.toString())
        .catch(() => ''),
      ckb.rpc
        .localNodeInfo()
        .then(res => res.version)
        .catch(() => ''),
      ckb.rpc
        .getTipBlockNumber()
        .then(n => BigInt(n).toString())
        .catch(() => ''),
      ckb.rpc
        .getPeers()
        .catch(() => [])
    ])
    const { platform, arch } = process
    const release = os.release()
    const status = {
      neuron: {
        version: neuronVersion,
        blockNumber: syncedBlockNumber
      },
      ckb: {
        url: /https?:\/\/(localhost|127.0.0.1)/.test(url) ? url : this.#ANONYMOUS_ADDRESS,
        version: ckbVersion,
        blockNumber: tipBlockNumber,
        peers,
      },
      client: {
        platform,
        arch,
        release,
      }
    }
    this.archive.append(JSON.stringify(status), {
      name: 'status.json'
    })
  }

  private addBundledCKBLog = () => {
    const name = 'bundled-ckb-log.json'
    const SIZE_TO_READ = 32_000

    return new Promise((resolve, reject) => {
      const logPath = path.resolve(ckbDataPath(), 'data', 'logs', 'run.log')
      if (!fs.existsSync(logPath)) { return reject(new Error("File not found")) }

      const fileStats = fs.statSync(logPath)
      const position = fileStats.size - SIZE_TO_READ

      fs.open(logPath, 'r', (openErr, fd) => {
        if (openErr) { return reject(openErr) }
        fs.read(fd, Buffer.alloc(SIZE_TO_READ), 0, SIZE_TO_READ, position, (readErr, _, buffer) => {
          fs.close(fd, closeErr => {
            const err = closeErr || readErr
            if (err) {
              return reject(err)
            }
            return resolve(buffer.toString('utf8'))
          })
        })
      })

    }).then((log: string) => {
      this.archive.append(log, { name })
    }).catch(err => {
      this.archive.append(err.message, { name })
    })
  }

  private async addHdPublicKeyInfoCsv() {
    const addressMetas = await AddressService.getAddressesByAllWallets()
    let csv = 'walletId,addressType,addressIndex,publicKeyInBlake160\n'
    for (const addressMeta of addressMetas) {
      const row = `${addressMeta.walletId},${addressMeta.addressType},${addressMeta.addressIndex},${addressMeta.blake160}\n`
      csv += row
    }
    const csvFileName = 'hd_public_key_info.csv'
    this.archive.append(csv, { name: csvFileName })
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
}
