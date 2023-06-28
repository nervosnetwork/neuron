import fs from 'fs'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import { t } from 'i18next'
import { ResponseCode } from '../utils/const'
import MultisigConfig from '../database/chain/entities/multisig-config'
import MultisigConfigModel from '../models/multisig-config'
import MultisigService from '../services/multisig'
import CellsService from '../services/cells'
import OfflineSignService from '../services/offline-sign'
import Multisig from '../models/multisig'
import SystemScriptInfo from '../models/system-script-info'
import NetworksService from '../services/networks'
import { config as lumosConig, helpers, utils, config } from '@ckb-lumos/lumos'

interface MultisigConfigOutput {
  multisig_configs: Record<
    string,
    {
      sighash_addresses: string[]
      require_first_n: number
      threshold: number
      alias?: string
    }
  >
}

const validateImportConfig = (configOutput: MultisigConfigOutput) => {
  return (
    configOutput.multisig_configs &&
    Object.values(configOutput.multisig_configs).length &&
    Object.values(configOutput.multisig_configs).every(
      config => config.sighash_addresses?.length >= Math.max(+config.require_first_n, +config.threshold)
    )
  )
}

export default class MultisigController {
  #multisigService: MultisigService

  constructor() {
    this.#multisigService = new MultisigService()
  }

  async saveConfig(params: { walletId: string; r: number; m: number; n: number; blake160s: string[]; alias?: string }) {
    const multiSignConfig = MultisigConfig.fromModel(
      new MultisigConfigModel(params.walletId, params.r, params.m, params.n, params.blake160s, params.alias)
    )
    const result = await this.#multisigService.saveMultisigConfig(multiSignConfig)
    return {
      status: ResponseCode.Success,
      result,
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
      result,
    }
  }

  async deleteConfig(id: number) {
    const { response } = await dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
      message: t('multisig-config.confirm-delete'),
      type: 'question',
      buttons: [t('multisig-config.delete-actions.ok'), t('multisig-config.delete-actions.cancel')],
    })
    if (response === 0) {
      await this.#multisigService.deleteConfig(id)
      return {
        status: ResponseCode.Success,
        result: true,
      }
    }
    return {
      status: ResponseCode.Success,
      result: false,
    }
  }

  async getConfig(walletId: string) {
    const result = await this.#multisigService.getMultisigConfig(walletId)
    return {
      status: ResponseCode.Success,
      result,
    }
  }

  async importConfig(walletId: string) {
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
      title: t('multisig-config.import-config'),
      filters: [
        {
          name: 'json',
          extensions: ['json'],
        },
      ],
      properties: ['openFile'],
    })

    if (canceled || !filePaths || !filePaths[0]) {
      return
    }
    try {
      const json = fs.readFileSync(filePaths[0], 'utf-8')
      const configOutput: MultisigConfigOutput = JSON.parse(json)
      if (!validateImportConfig(configOutput)) {
        dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
        return
      }
      const saveConfigs = Object.values(configOutput.multisig_configs).map(config => ({
        r: +config.require_first_n,
        m: +config.threshold,
        n: config.sighash_addresses.length,
        blake160s: config.sighash_addresses.map(v => {
          const isMainnet = v.startsWith('ckb')
          const lumosOptions = isMainnet
            ? { config: lumosConig.predefined.LINA }
            : { config: lumosConig.predefined.AGGRON4 }
          return helpers.addressToScript(v, lumosOptions).args
        }),
        walletId,
        alias: config.alias,
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
        message: t('multisig-config.import-result', {
          success: saveSuccessConfigs.length,
          fail: savedResult.length - saveSuccessConfigs.length,
          failCheck: savedResult.length > saveSuccessConfigs.length ? t('multisig-config.import-duplicate') : undefined,
        }),
      })
      return {
        status: ResponseCode.Success,
        result: saveSuccessConfigs,
      }
    } catch {
      dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
    }
  }

  async exportConfig(
    configs: {
      id: string
      walletId: string
      r: number
      m: number
      n: number
      blake160s: string[]
      alias?: string
    }[]
  ) {
    const { canceled, filePath } = await dialog.showSaveDialog(BrowserWindow.getFocusedWindow()!, {
      title: t('multisig-config.export-config'),
      defaultPath: `multisig-config_${Date.now()}.json`,
    })
    if (canceled || !filePath) {
      return
    }
    const isMainnet = NetworksService.getInstance().isMainnet()
    const lumosOptions = isMainnet ? { config: lumosConig.predefined.LINA } : { config: lumosConig.predefined.AGGRON4 }

    const output: MultisigConfigOutput = { multisig_configs: {} }
    configs.forEach(v => {
      output.multisig_configs[Multisig.hash(v.blake160s, v.r, v.m, v.n)] = {
        sighash_addresses: v.blake160s.map(args =>
          helpers.encodeToAddress(SystemScriptInfo.generateSecpScript(args), lumosOptions)
        ),
        require_first_n: v.r,
        threshold: v.m,
        alias: v.alias,
      }
    })

    fs.writeFileSync(filePath, JSON.stringify(output, undefined, 2))

    dialog.showMessageBox({
      type: 'info',
      message: t('multisig-config.config-exported', { filePath }),
    })

    return {
      status: ResponseCode.Success,
      result: {
        filePath: path.basename(filePath),
        configs,
      },
    }
  }

  async getMultisigBalances({ isMainnet, multisigAddresses }: { isMainnet: boolean; multisigAddresses: string[] }) {
    const balances = await CellsService.getMultisigBalances(isMainnet, multisigAddresses)
    return {
      status: ResponseCode.Success,
      result: balances,
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
    const isMainnet = fullPayload.startsWith('ckb')
    const lumosOptions = isMainnet ? { config: config.predefined.LINA } : { config: config.predefined.AGGRON4 }
    const lockHash = utils.computeScriptHash(helpers.addressToScript(fullPayload, lumosOptions))
    if (tx.transaction.inputs.every(v => v.lockHash !== lockHash)) {
      dialog.showErrorBox(t('common.error'), t('messages.multisig-lock-hash-mismatch'))
      return {
        status: ResponseCode.Fail,
      }
    }
    return {
      status: ResponseCode.Success,
      result: result?.json,
    }
  }
}
