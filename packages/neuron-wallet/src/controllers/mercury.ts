import path from 'path'
import fs from 'fs'
import env from '../env'
import { dialog } from 'electron'
import { t } from 'i18next'
import SettingsService from '../services/settings'

const { app } = env

export const migrate = async () => {
  const ckbPath = SettingsService.getInstance().ckbDataPath

  const lumosDataPath = path.resolve(app.getPath('userData'), app.isPackaged ? '' : 'dev', 'indexer_data')
  const ckbIndexerDataPath = path.resolve(app.getPath('userData'), app.isPackaged ? '' : 'dev', 'ckb-indexer')

  // User has old synchronized data
  if (fs.existsSync(ckbPath) && fs.existsSync(lumosDataPath)) {
    fs.rmSync(lumosDataPath, { recursive: true, force: true })
    fs.rmSync(ckbPath, { recursive: true, force: true })
    await openMigrateDialog('hard-fork')
  }

  if (fs.existsSync(ckbIndexerDataPath)) {
    fs.rmSync(ckbIndexerDataPath, { recursive: true, force: true })
    await openMigrateDialog('hard-fork')
  }
  // TODO: mercury migration when mercury 1.0 is ready
  // TODO: could this be removed?
}

const openMigrateDialog = (type: 'hard-fork' | 'mercury') => {
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
