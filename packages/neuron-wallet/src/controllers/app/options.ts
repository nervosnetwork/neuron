import { MenuItemConstructorOptions, clipboard } from 'electron'
import prompt from 'electron-prompt'

import logger from '../../utils/logger'
import NetworksController from '../networks'
import AppController from '.'
import i18n from '../../utils/i18n'
import WalletsController from '../wallets'
import windowManage from '../../utils/windowManage'
import { Channel } from '../../utils/const'
import env from '../../env'

export enum MenuCommand {
  ShowAbout = 'show-about',
  ShowPreferences = 'show-preferences',
  ShowTerminal = 'show-terminal',
  OpenNervosWebsite = 'open-nervos-website',
  OpenSourceCodeRepository = 'open-sourcecode-repository',
  SetUILocale = 'set-ui-language',
}

export enum URL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Preference = '/settings/general',
  Terminal = '/terminal',
}

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
                NetworksController.delete(id)
              }
            },
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
        click: () => {
          // TODO: backup
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
              const res = await WalletsController.delete({ id, password })
              windowManage.sendToFocusedWindow(Channel.Wallets, 'delete', res)
            })
            .catch((err: Error) => {
              logger.log({ level: 'error', message: err.message })
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
