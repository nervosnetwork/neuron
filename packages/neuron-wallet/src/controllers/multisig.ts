import fs from 'fs'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import { t } from 'i18next'
import { addressToScript, scriptToHash } from '@nervosnetwork/ckb-sdk-utils'
import { ResponseCode } from 'utils/const'
import MultisigConfig from 'database/chain/entities/multisig-config'
import MultisigConfigModel from 'models/multisig-config'
import MultisigService from 'services/multisig'
import CellsService from 'services/cells'
import OfflineSignService from 'services/offline-sign'

export default class MultisigController {
  // eslint-disable-next-line prettier/prettier
  #multisigService: MultisigService;

  constructor() {
    this.#multisigService = new MultisigService();
  }

  async saveConfig(params: {
    walletId: string
    r: number
    m: number
    n: number
    blake160s: string[]
    alias: string
  }) {
    const multiSignConfig = MultisigConfig.fromModel(new MultisigConfigModel(
      params.walletId,
      params.r,
      params.m,
      params.n,
      params.blake160s,
      params.alias
    ))
    const result = await this.#multisigService.saveMultisigConfig(multiSignConfig)
    return {
      status: ResponseCode.Success,
      result
    }
  }


  async updateConfig(params: {
    id: number
    walletId?: string
    r?: number
    m?: number
    n?: number
    addresses?: string[]
    alias?: string
  }) {
    const result = await this.#multisigService.updateMultisigConfig(params)
    return {
      status: ResponseCode.Success,
      result
    }
  }

  async deleteConfig(id: number) {
    const { response } = await dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
      message: t('multisig-config.confirm-delete'),
      type: 'question',
      buttons: [
        t('multisig-config.delete-actions.ok'),
        t('multisig-config.delete-actions.cancel')
      ]
    })
    if (response === 0) {
      await this.#multisigService.deleteConfig(id)
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

  async getConfig(walletId: string) {
    const result = await this.#multisigService.getMultisigConfig(walletId)
    return {
      status: ResponseCode.Success,
      result
    }
  }

  async importConfig(walletId: string) {
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
      title: t('multisig-config.import-config'),
      filters: [{
        name: 'json',
        extensions: ['json']
      }],
      properties: ['openFile']
    })

    if (canceled || !filePaths || !filePaths[0]) {
      return
    }
    try {
      const json = fs.readFileSync(filePaths[0], 'utf-8')
      let configs: Array<{r: number, m: number, n: number, blake160s: string[], alias: string}> = JSON.parse(json)
      if (!Array.isArray(configs)) {
        configs = [configs]
      }
      if (
        configs.some(config => config.r === undefined
          || config.m === undefined
          || config.n === undefined
          || config.blake160s === undefined)
      ) {
        dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
        return
      }
      const saveConfigs = configs.map(config => ({
        ...config,
        walletId,
      }))
      const savedResult = await Promise.allSettled(saveConfigs.map(config => this.saveConfig(config)))
      const saveSuccessConfigs: MultisigConfig[] = []
      for (let idx = 0; idx < savedResult.length; idx++) {
        const item = savedResult[idx]
        if (item.status === 'fulfilled') {
          saveSuccessConfigs.push(item.value.result)
        }
      }
      dialog.showMessageBox({
        type: 'info',
        message: t(
          'multisig-config.import-result',
          {
            success: saveSuccessConfigs.length,
            fail: savedResult.length - saveSuccessConfigs.length,
            failCheck: savedResult.length > saveSuccessConfigs.length ? t('multisig-config.import-duplicate') : undefined,
          })
      })
      return {
        status: ResponseCode.Success,
        result: saveSuccessConfigs
      }
    } catch {
      dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
    }
  }

  async exportConfig(configs: {
    id: string
    walletId: string
    r: number
    m: number
    n: number
    blake160s: string[]
    alias?: string
  }[]) {
    const { canceled, filePath } = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, {
      title: t('multisig-config.export-config'),
      defaultPath: `multisig-config_${Date.now()}.json`
    })
    if (canceled || !filePath) {
      return
    }

    fs.writeFileSync(filePath, JSON.stringify(configs))

    dialog.showMessageBox({
      type: 'info',
      message: t('multisig-config.config-exported', { filePath })
    })

    return {
      status: ResponseCode.Success,
      result: {
        filePath: path.basename(filePath),
        configs
      }
    }
  }

  async getMultisigBalances({ isMainnet, multisigAddresses}: { isMainnet: boolean , multisigAddresses: string[] }) {
    const balances = await CellsService.getMultisigBalances(isMainnet, multisigAddresses)
    return {
      status: ResponseCode.Success,
      result: balances
    }
  }

  async loadMultisigTxJson(fullPayload: string) {
    const result = await OfflineSignService.loadTransactionJSON()
    if (!result) {
      return {
        status: ResponseCode.Fail,
      }
    }
    const tx = result.json
    const lockHash = scriptToHash(addressToScript(fullPayload))
    if (tx.transaction.inputs.every(v => v.lockHash !== lockHash)) {
      dialog.showErrorBox(t('common.error'), t('messages.multisig-lock-hash-mismatch'))
      return {
        status: ResponseCode.Fail
      }
    }
    return {
      status: ResponseCode.Success,
      result: result?.json
    }
  }
}