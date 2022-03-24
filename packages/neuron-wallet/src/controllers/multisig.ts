import fs from 'fs'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import { t } from 'i18next'
import { scriptToAddress, addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { ResponseCode } from 'utils/const'
import MultiSign from 'models/multi-sign'
import SystemScriptInfo from 'models/system-script-info'
import MultisigConfig from 'database/chain/entities/multisig-config'
import MultisigConfigModel from 'models/multisig-config'
import MultisigService from 'services/multisig'
import { MultisigConfigAddressError } from 'exceptions/multisig'
import CellsService from 'services/cells'

export default class MultisigController {
  // eslint-disable-next-line prettier/prettier
  #multisigService: MultisigService;

  constructor() {
    this.#multisigService = new MultisigService();
  }

  createMultisigAddress(params: {
    r: number
    m: number
    n: number
    addresses: string[]
    isMainnet: boolean
  }) {
    const multiSign = new MultiSign();
    const multiSignPrefix = {
      S: '0x00',
      R: `0x${params.r.toString(16).padStart(2, '0')}`,
      M: `0x${params.m.toString(16).padStart(2, '0')}`,
      N: `0x${params.n.toString(16).padStart(2, '0')}`,
    };
    const blake160s = params.addresses.map(address => addressToScript(address).args)
    if (blake160s.some(blake160 => blake160.length !== 42)) {
      throw new MultisigConfigAddressError()
    }
    return {
      status: ResponseCode.Success,
      result: scriptToAddress(
        {
          args: multiSign.hash(blake160s, multiSignPrefix),
          codeHash: SystemScriptInfo.MULTI_SIGN_CODE_HASH,
          hashType: SystemScriptInfo.MULTI_SIGN_HASH_TYPE
        },
        params.isMainnet
      )
    }
  }

  async saveConfig(params: {
    walletId: string
    r: number
    m: number
    n: number
    addresses: string[]
    alias: string
    fullPayload: string
  }) {
    const multiSignConfig = MultisigConfig.fromModel(new MultisigConfigModel(
      params.walletId,
      params.m,
      params.n,
      params.r,
      params.addresses,
      params.fullPayload,
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
    fullPayload?: string
  }) {
    const result = await this.#multisigService.updateMultisigConfig(params)
    return {
      status: ResponseCode.Success,
      result
    }
  }

  async deleteConfig(params: { id: number }) {
    const { response } = await dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
      message: t('multisig-config.confirm-delete'),
      type: 'question',
      buttons: [
        t('multisig-config.delete-actions.ok'),
        t('multisig-config.delete-actions.cancel')
      ]
    })
    if (response === 0) {
      await this.#multisigService.deleteConfig(params.id)
      return {
        status: ResponseCode.Success,
      }
    }
    return {
      status: ResponseCode.Fail,
    }
  }

  async getConfig(params: {
    walletId: string
  }) {
    const result = await this.#multisigService.getMultisigConfig(params.walletId)
    return {
      status: ResponseCode.Success,
      result
    }
  }

  async importConfig({ isMainnet, walletId }: { isMainnet: boolean, walletId: string }) {
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
      let configs: Array<{r: number, m: number, n: number, addresses: string[], alias: string}> = JSON.parse(json)
      if (!Array.isArray(configs)) {
        configs = [configs]
      }
      if (
        configs.some(config => config.r === undefined
          || config.m === undefined
          || config.n === undefined
          || config.addresses === undefined)
      ) {
        dialog.showErrorBox(t('common.error'), t('messages.invalid-json'))
        return
      }
      const saveConfigs = configs.map(config => ({
        ...config,
        walletId,
        fullPayload: this.createMultisigAddress({ ...config, isMainnet }).result
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
    addresses: string[]
    alias?: string
    fullPayload: string
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
    console.log(CellsService)
    const balances = await CellsService.getMultisigBalances(isMainnet, multisigAddresses)
    return {
      status: ResponseCode.Success,
      result: balances
    }
  }
}