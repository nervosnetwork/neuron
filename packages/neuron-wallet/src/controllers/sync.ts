import { dialog } from 'electron'
import SyncedBlockNumber from 'models/synced-block-number'
import { createBlockSyncTask, killBlockSyncTask } from 'block-sync-renderer'
import ChainCleaner from 'database/chain/cleaner'
import { ResponseCode } from 'utils/const'
import AddressDao from 'database/address/address-dao'
import i18n from 'locales/i18n'

export default class SyncController {
  public async clearCache() {
    const confirmed = await this.confirmToClear()
    if (confirmed) {
      await this.doClearTask()
      return {
        status: ResponseCode.Success,
        result: true
      }
    }
    return {
      status: ResponseCode.Success,
      result: false
    }
  }

  public async currentBlockNumber() {
    const blockNumber = new SyncedBlockNumber()
    const current: bigint = await blockNumber.getNextBlock()

    return {
      status: ResponseCode.Success,
      result: {
        currentBlockNumber: current.toString(),
      },
    }
  }

  private confirmToClear = async () => {
    const I18N_PATH = 'messageBox.clear-cache'
    try {
      const res = await dialog.showMessageBox({
        type: 'question',
        buttons: ['cancel', 'ok'].map(label => i18n.t(`${I18N_PATH}.buttons.${label}`)),
        defaultId: 1,
        cancelId: 0,
        title: i18n.t(`${I18N_PATH}.title`),
        message: i18n.t(`${I18N_PATH}.message`),
        detail: i18n.t(`${I18N_PATH}.detail`),
      })

      return res.response === 1
    } catch {
      return false
    }
  }

  private doClearTask = async () => {
    killBlockSyncTask()
    AddressDao.resetAddresses()
    await ChainCleaner.clean()
    await createBlockSyncTask(true)
  }
}
