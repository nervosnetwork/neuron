import fs from 'fs'
import { dialog } from 'electron'
import { t } from 'i18next'
import type { OfflineSignJSON } from 'models/offline-sign'

export default class OfflineSignService  {
  public static async loadTransactionJSON () {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: t('offline-signature.load-transaction'),
      filters: [{
        name: 'json',
        extensions: ['json']
      }],
      properties: ['openFile']
    })

    if (canceled || !filePaths || !filePaths[0]) {
      return
    }

    const [filePath] = filePaths

    const file = fs.readFileSync(filePath, 'utf-8')

    try {
      const json: OfflineSignJSON = JSON.parse(file)
      if (!json.transaction) {
        dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
        return
      }
      return json
    } catch (err) {
      dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
    }
  }
}
