import { ckbDataPath } from 'services/ckb-runner'
import * as path from 'path'
import * as fs from 'fs'
import env from 'env'
import { dialog } from 'electron'
import { t } from 'i18next'
import { deleteFolderRecursive } from 'block-sync-renderer/sync/indexer-folder-manager'

const { app } = env

export default class MerucuryController {
  async migrate() {
    const ckbPath = ckbDataPath()
    const lumosIndexerDBFolder = './indexer_data'
    const lumosDataPath = app.isPackaged ?
      path.resolve(app.getPath('userData'), lumosIndexerDBFolder) :
      path.resolve(app.getPath('userData'), './dev', lumosIndexerDBFolder)
    const ckbIndexerDBFolder = './ckb-indexer'
    const ckbIndexerDataPath = app.isPackaged ?
      path.resolve(app.getPath('userData'), ckbIndexerDBFolder) :
      path.resolve(app.getPath('userData'), './dev', ckbIndexerDBFolder)
    // User has old synchronized data
    if (fs.existsSync(ckbPath) && fs.existsSync(lumosDataPath)) {
      deleteFolderRecursive(lumosDataPath)
      deleteFolderRecursive(ckbPath)
      await this.openMigrateDialog('hard-fork')
    }
    if (fs.existsSync(ckbIndexerDataPath)) {
      deleteFolderRecursive(ckbIndexerDataPath)
      await this.openMigrateDialog('hard-fork')
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
