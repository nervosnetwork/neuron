import fs from 'fs'
import { MenuItemConstructorOptions, clipboard, dialog } from 'electron'
import prompt from 'electron-prompt'

import NetworksController from '../networks'
import WalletsController from '../wallets'
import NetworksService from '../../services/networks'
import WalletsService from '../../services/wallets'
import AppController from '.'
import i18n from '../../utils/i18n'
import env from '../../env'
import { IncorrectPassword } from '../../exceptions/wallet'

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
}

const networksService = NetworksService.getInstance()
const walletsService = WalletsService.getInstance()

export const contextMenuTemplate: {
  [key: string]: (id: string) => Promise<MenuItemConstructorOptions[]>
} = {
  networkList: async (id: string) => {
    const { result: network } = await NetworksController.get(id)
    const { result: activeNetworkId } = await NetworksController.activeId()
    const isActive = activeNetworkId === id
    const isDefault = network.type === 0

    return [
      {
        label: i18n.t('contextMenu.select'),
        enabled: !isActive,
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
              detail: isActive ? i18n.t('messageBox.remove-network.alert') : '',
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
          prompt({
            title: i18n.t('messageBox.backup-keystore.title'),
            label: i18n.t('messageBox.backup-keystore.password'),
            value: '',
            inputAttrs: {
              type: 'password',
            },
          })
            .then(async (password: string | null = '') => {
              if (password === null) return

              const wallet = await walletsService.get(id)

              if (!walletsService.validate({ id, password })) throw new IncorrectPassword()

              const keystore = wallet.loadKeystore()
              dialog.showSaveDialog(
                {
                  title: i18n.t('messages.save-keystore'),
                  defaultPath: wallet.name,
                },
                (filename?: string) => {
                  if (filename) {
                    fs.writeFileSync(filename, JSON.stringify(keystore))
                  }
                }
              )
            })
            .catch((err: Error) => {
              dialog.showMessageBox({
                type: 'error',
                message: err.message,
              })
            })
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
        click: () => {
          prompt({
            title: i18n.t('messageBox.remove-wallet.title'),
            label: i18n.t('messageBox.remove-wallet.password'),
            value: '',
            inputAttrs: {
              type: 'password',
            },
          })
            .then(async (password: string | null = '') => {
              if (password === null) return
              await WalletsController.delete({ id, password })
            })
            .catch((err: Error) => {
              dialog.showMessageBox({
                type: 'error',
                message: err.message,
              })
            })
        },
      },
    ]
  },
  addressList: async (address: string) => {
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
        click: () => AppController.navTo(`/transaction/${hash}`),
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
