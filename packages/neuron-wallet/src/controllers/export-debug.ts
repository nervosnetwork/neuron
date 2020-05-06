import os from 'os'
import fs from 'fs'
import path from 'path'
import archiver from 'archiver'
import CKB from '@nervosnetwork/ckb-sdk-core'
import { app, dialog } from 'electron'
import logger from 'electron-log'
import i18n from 'locales/i18n'
import NetworksService from 'services/networks'
import SyncedBlockNumber from 'models/synced-block-number'

export default class ExportDebugController {
  archive: archiver.Archiver
  constructor() {
    this.archive = archiver('zip', {
      zlib: { level: 9 }
    })
    this.archive.on('error', err => {
      dialog.showErrorBox(i18n.t('common.error'), err.message)
    })
  }

  public async export() {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: i18n.t('export-debug-info.export-debug-info'),
        defaultPath: `neuron_debug_${Date.now()}.zip`
      })
      if (canceled || !filePath) {
        return
      }
      this.archive.pipe(fs.createWriteStream(filePath))
      await this.addStatusFile()
      this.addLogFiles()
      await this.archive.finalize()
      dialog.showMessageBox({
        type: 'info',
        message: i18n.t('export-debug-info.debug-info-exported', { file: filePath })
      })
    } catch (err) {
      dialog.showErrorBox(i18n.t('common.error'), err.message)
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
        url: /https?:\/\/(localhost|127.0.0.1)/.test(url) ? url : 'http://****:port',
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
