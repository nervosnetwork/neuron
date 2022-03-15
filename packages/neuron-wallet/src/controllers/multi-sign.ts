import fs from 'fs'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import { t } from 'i18next'
import { scriptToAddress, addressToScript } from '@nervosnetwork/ckb-sdk-utils'
import { ResponseCode } from 'utils/const'
import MultiSign from 'models/multi-sign'
import SystemScriptInfo from 'models/system-script-info'
import MultiSignConfig from 'database/chain/entities/multi-sign-config'
import MultiSignConfigModel from 'models/multi-sign-config'
import MultiSignService from 'services/multi-sign'
import { ImportMultiSignConfigParamsError } from 'exceptions/multi-sign'

export default class MultiSignController {
  // eslint-disable-next-line prettier/prettier
  #multiSignService: MultiSignService;

  constructor() {
    this.#multiSignService = new MultiSignService();
  }

  createMultiSignAddress(params: {
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
    const multiSignConfig = MultiSignConfig.fromModel(new MultiSignConfigModel(
      params.walletId,
      params.m,
      params.n,
      params.r,
      params.addresses,
      params.fullPayload,
      params.alias
    ))
    const result = await this.#multiSignService.saveMultiSignConfig(multiSignConfig)
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
    const result = await this.#multiSignService.updateMultiSignConfig(params)
    return {
      status: ResponseCode.Success,
      result
    }
  }

  async deleteConfig(params: { id: number }) {
    const { response } = await dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
      message: t('multi-sign-config.confirm-delete'),
      type: 'question',
      buttons: [
        t('multi-sign-config.delete-actions.ok'),
        t('multi-sign-config.delete-actions.cancel')
      ]
    })
    if (response === 0) {
      await this.#multiSignService.deleteConfig(params.id)
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
    const result = await this.#multiSignService.getMultiSignConfig(params.walletId)
    return {
      status: ResponseCode.Success,
      result
    }
  }

  async importConfig({ isMainnet }: { isMainnet: boolean }) {
    const { canceled, filePaths } = await dialog.showOpenDialog(BrowserWindow.getFocusedWindow()!, {
      title: t('multi-sign-config.import-config'),
      filters: [{
        name: 'json',
        extensions: ['json']
      }],
      properties: ['openFile']
    })

    if (canceled || !filePaths || !filePaths[0]) {
      return
    }
    const json = fs.readFileSync(filePaths[0], 'utf-8')
    const config = JSON.parse(json)
    if (
      config.r === undefined
      || config.m === undefined
      || config.n === undefined
      || config.addresses === undefined
    ) {
      throw new ImportMultiSignConfigParamsError()
    }
    const fullPayload = this.createMultiSignAddress({ ...config, isMainnet })
    return {
      status: ResponseCode.Success,
      result: {
        ...config,
        fullPayload: fullPayload.result
      }
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
      title: t('multi-sign-config.export-config'),
      defaultPath: `multi-sign-config_${Date.now()}.json`
    })
    if (canceled || !filePath) {
      return
    }

    fs.writeFileSync(filePath, JSON.stringify(configs))

    dialog.showMessageBox({
      type: 'info',
      message: t('multi-sign-config.config-exported', { filePath })
    })

    return {
      status: ResponseCode.Success,
      result: {
        filePath: path.basename(filePath),
        configs
      }
    }
  }
}