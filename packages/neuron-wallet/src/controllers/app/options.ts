import { MenuItemConstructorOptions, clipboard, dialog, MessageBoxReturnValue } from 'electron'
import { bech32Address } from '@nervosnetwork/ckb-sdk-utils'

import WalletsService from 'services/wallets'
import NetworksService from 'services/networks'
import i18n from 'utils/i18n'
import env from 'env'
import AppController from '.'

export enum URL {
  Preference = '/settings/general',
  CreateWallet = '/wizard/mnemonic/create',
  ImportMnemonic = '/wizard/mnemonic/import',
  ImportKeystore = '/keystore/import',
}

const networksService = NetworksService.getInstance()

export const contextMenuTemplate: {
  [key: string]: (id: string) => Promise<MenuItemConstructorOptions[]>
} = {
  networkList: async (id: string) => {
    const [network, currentNetworkID] = await Promise.all([
      networksService.get(id).catch(() => null),
      networksService.getCurrentID().catch(() => null),
    ])

    if (!network) {
      AppController.showMessageBox({
        type: 'error',
        message: i18n.t('messages.network-not-found', { id }),
      })
      return []
    }

    const isCurrent = currentNetworkID === id
    const isDefault = network.type === 0

    return [
      {
        label: i18n.t('contextMenu.select'),
        enabled: !isCurrent,
        click: () => {
          networksService.activate(id).catch((err: Error) => {
            AppController.showMessageBox({
              type: 'error',
              message: err.message,
            })
          })
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
            (returnValue: MessageBoxReturnValue) => {
              if (returnValue.response === 0) {
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
    const walletsService = WalletsService.getInstance()
    const wallet = walletsService.get(id)
    if (!wallet) {
      AppController.showMessageBox({
        type: 'error',
        message: i18n.t('messages.wallet-not-found', { id }),
      })
    }
    return [
      {
        label: i18n.t('contextMenu.select'),
        click: () => {
          try {
            walletsService.setCurrent(id)
          } catch (err) {
            AppController.showMessageBox({ type: 'error', message: err.message })
          }
        },
      },
      {
        label: i18n.t('contextMenu.backup'),
        click: async () => {
          walletsService.requestPassword(id, 'backup-wallet')
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
          walletsService.requestPassword(id, 'delete-wallet')
        },
      },
    ]
  },
  addressList: async (identifier: string) => {
    if (identifier === undefined) {
      return []
    }

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
        label: i18n.t('contextMenu.copy-transaction-hash'),
        click: () => {
          clipboard.writeText(hash)
        },
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

export default { URL }
