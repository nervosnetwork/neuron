import { MenuItemConstructorOptions, clipboard, dialog } from 'electron'
import { bech32Address } from '@nervosnetwork/ckb-sdk-utils'

import NetworksController from '../networks'
import WalletsController from '../wallets'
import NetworksService from '../../services/networks'
import AppController from '.'
import i18n from '../../utils/i18n'
import env from '../../env'

export enum MenuCommand {
  ShowAbout = 'show-about',
  ShowPreferences = 'show-preferences',
  OpenNervosWebsite = 'open-nervos-website',
  OpenSourceCodeRepository = 'open-sourcecode-repository',
  SetUILocale = 'set-ui-language',
}

export enum URL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Preference = '/settings/general',
  CreateWallet = '/wizard/mnemonic/create',
  ImportWallet = '/wizard/mnemonic/import',
}

const networksService = NetworksService.getInstance()

export const contextMenuTemplate: {
  [key: string]: (id: string) => Promise<MenuItemConstructorOptions[]>
} = {
  networkList: async (id: string) => {
    const { result: network } = await NetworksController.get(id)
    const { result: currentNetworkID } = await NetworksController.currentID()
    const isCurrent = currentNetworkID === id
    const isDefault = network.type === 0

    return [
      {
        label: i18n.t('contextMenu.select'),
        enabled: !isCurrent,
        click: () => {
          NetworksController.activate(id)
        },
      },
      {
        label: i18n.t('contextMenu.edit'),
        enabled: !isDefault,
        click: () => {
          AppController.navTo(`/network/${id}`)
        },
      },
      {
        label: i18n.t('contextMenu.delete'),
        enabled: !isDefault,
        cancelId: 1,
        click: async () => {
          AppController.showMessageBox(
            {
              type: 'warning',
              title: i18n.t(`messageBox.remove-network.title`),
              message: i18n.t(`messageBox.remove-network.message`, {
                name: network.name,
                address: network.remote,
              }),
              detail: isCurrent ? i18n.t('messageBox.remove-network.alert') : '',
              buttons: [i18n.t('messageBox.button.confirm'), i18n.t('messageBox.button.discard')],
            },
            (btnIdx: number) => {
              if (btnIdx === 0) {
                try {
                  networksService.delete(id)
                } catch (err) {
                  dialog.showMessageBox({
                    type: 'error',
                    message: err.message,
                  })
                }
              }
            }
          )
        },
      },
    ]
  },
  walletList: async (id: string) => {
    return [
      {
        label: i18n.t('contextMenu.select'),
        click: () => {
          WalletsController.activate(id)
        },
      },
      {
        label: i18n.t('contextMenu.backup'),
        click: async () => {
          const res = await WalletsController.backup(id)
          if (!res.status) {
            AppController.showMessageBox({
              type: 'error',
              message: res.msg!,
            })
          }
        },
      },
      {
        label: i18n.t('contextMenu.edit'),
        click: () => {
          AppController.navTo(`/editwallet/${id}`)
        },
      },
      {
        label: i18n.t('contextMenu.delete'),
        click: async () => {
          const res = await WalletsController.delete(id)
          if (!res.status) {
            AppController.showMessageBox({
              type: 'error',
              message: res.msg!,
            })
          }
        },
      },
    ]
  },
  addressList: async (identifier: string) => {
    if (identifier === undefined) return []

    const address = bech32Address(identifier)
    return [
      {
        label: i18n.t('contextMenu.copy-address'),
        click: () => {
          clipboard.writeText(address)
        },
      },
      {
        label: i18n.t('contextMenu.request-payment'),
        click: () => {
          AppController.navTo(`/receive/${address}`)
        },
      },
      {
        label: i18n.t('contextMenu.spend-from'),
        click: () => {
          AppController.navTo(`/send/${address}`)
        },
      },
      {
        label: i18n.t('contextMenu.view-on-explorer'),
        click: () => {
          AppController.openExternal(`${env.explorer}/address/${address}`)
        },
      },
    ]
  },
  transactionList: async (hash: string) => {
    return [
      {
        label: i18n.t('contextMenu.detail'),
        click: () => AppController.showTransactionDetails(hash),
      },
      {
        label: i18n.t('contextMenu.view-on-explorer'),
        click: () => {
          AppController.openExternal(`${env.explorer}/transaction/${hash}`)
        },
      },
    ]
  },
}

export default { MenuCommand, URL }
