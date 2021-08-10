import { ckbDataPath } from 'services/ckb-runner'
import * as path from 'path'
import * as fs from 'fs'
import env from 'env'
import { dialog } from 'electron'
import { t } from 'i18next'
import { deleteFolderRecursive } from 'block-sync-renderer/sync/indexer-folder-manager'
import NodeController from './node'
import SyncController from './sync'

const { app } = env

export default class MerucuryController {
  async migrate() {
    const ckbPath = ckbDataPath()
    const lumosIndexerDBFolder = './indexer_data'
    const lumosDataPath = path.resolve(app.getPath('userData'), lumosIndexerDBFolder)
    // User has old synchronized data
    if (fs.existsSync(ckbPath) && fs.existsSync(lumosDataPath)) {
      const node = new NodeController()
      await node.stopNode()
      await this.openMigrateDialog('hard-fork')
      deleteFolderRecursive(lumosDataPath)
      deleteFolderRecursive(ckbPath)
      await node.startNode()
      const syncController = new SyncController()
      await syncController.clearCache(true)
    }
    // TODO: mercury migration when mercury 1.0 is ready
  }

  openMigrateDialog(type: 'hard-fork' | 'mercury') {
    const I18N_PATH = type === 'hard-fork' ? `messageBox.hard-fork-migrate` : 'messageBox.mercury-migrate'
    return dialog.showMessageBox({
      type: 'info',
      buttons: [],
      defaultId: 1,
      message: t(`${I18N_PATH}.message`),
      cancelId: 0,
      noLink: true,
    })
  }
}
