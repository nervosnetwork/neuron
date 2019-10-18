import { dialog, MenuItemConstructorOptions, clipboard, Menu, MenuItem, MessageBoxReturnValue } from 'electron'
import { bech32Address, AddressPrefix, AddressType } from '@nervosnetwork/ckb-sdk-utils'
import i18n from 'utils/i18n'
import app from 'app'
import env from 'env'
import AppController from 'controllers/app'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'

// TODO: Refactor this to remove circular reference between menu and app controller.
// Perhaps menu should only do dispatching.

enum ExternalURL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Issues = 'https://github.com/nervosnetwork/neuron/issues',
}

const isMac = process.platform === 'darwin'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const networksService = NetworksService.getInstance()

const generateTemplate = () => {
  const appMenuItem: MenuItemConstructorOptions = {
    id: 'app',
    label: app.getName(),
    submenu: [
      {
        id: 'about',
        label: i18n.t('application-menu.neuron.about', {
          app: app.getName(),
        }),
        role: 'about',
        click: () => { AppController.showAbout() },
      },
      {
        label: i18n.t('application-menu.neuron.check-updates'),
        click: (menuItem: MenuItem) => { AppController.checkUpdates(menuItem) }
      },
      separator,
      {
        id: 'preference',
        label: i18n.t('application-menu.neuron.preferences'),
        accelerator: 'CmdOrCtrl+,',
        click: () => { AppController.showPreference() }
      },
      separator,
      {
        label: i18n.t('application-menu.neuron.quit', {
          app: app.getName(),
        }),
        role: 'quit',
      },
    ],
  }

  const walletMenuItem: MenuItemConstructorOptions = {
    id: 'wallet',
    label: i18n.t('application-menu.wallet.label'),
    submenu: [
      { id: 'select', label: i18n.t('application-menu.wallet.select'), submenu: [] },
      {
        id: 'create',
        label: i18n.t('application-menu.wallet.create-new'),
        click: () => { AppController.createWallet() }
      },
      {
        id: 'import',
        label: i18n.t('application-menu.wallet.import'),
        submenu: [
          {
            id: 'import-with-mnemonic',
            label: i18n.t('application-menu.wallet.import-mnemonic'),
            click: () => { AppController.importWallet('mnemonic') }
          },
          {
            id: 'import-with-keystore',
            label: i18n.t('application-menu.wallet.import-keystore'),
            click: () => { AppController.importWallet('keystore') },
          },
        ],
      },
      separator,
      {
        id: 'backup',
        label: i18n.t('application-menu.wallet.backup'),
        click: () => {
          const walletsService = WalletsService.getInstance()
          const currentWallet = walletsService.getCurrent()
          if (!currentWallet) {
            return
          }
          walletsService.requestPassword(currentWallet.id, 'backup-wallet')
        },
      },
      {
        id: 'delete',
        label: i18n.t('application-menu.wallet.delete'),
        click: () => {
          const walletsService = WalletsService.getInstance()
          const currentWallet = walletsService.getCurrent()
          if (!currentWallet) {
            return
          }
          walletsService.requestPassword(currentWallet.id, 'delete-wallet')
        },
      },
    ],
  }

  const editMenuItem: MenuItemConstructorOptions = {
    id: 'edit',
    label: i18n.t('application-menu.edit.label'),
    submenu: [
      {
        label: i18n.t('application-menu.edit.cut'),
        role: 'cut',
      },
      {
        label: i18n.t('application-menu.edit.copy'),
        role: 'copy',
      },
      {
        label: i18n.t('application-menu.edit.paste'),
        role: 'paste',
      },
      separator,
      {
        label: i18n.t('application-menu.edit.selectall'),
        role: 'selectAll',
      },
    ],
  }

  const viewMenuItem: MenuItemConstructorOptions = {
    id: 'view',
    label: i18n.t('application-menu.view.label'),
    submenu: [
      {
        label: i18n.t('application-menu.view.fullscreen'),
        role: 'togglefullscreen',
      },
      {
        label: i18n.t('application-menu.view.address-book'),
        click: () => { AppController.toggleAddressBook() },
        accelerator: 'CmdOrCtrl+B',
      },
    ],
  }

  const windowMenuItem: MenuItemConstructorOptions = {
    id: 'window',
    label: i18n.t('application-menu.window.label'),
    submenu: [
      {
        label: i18n.t('application-menu.window.minimize'),
        role: 'minimize',
      },
      {
        label: i18n.t('application-menu.window.close'),
        role: 'close',
      },
    ],
  }

  const helpSubmenu: MenuItemConstructorOptions[] = [
    {
      label: 'Nervos',
      click: () => { AppController.openExternal(ExternalURL.Website) }
    },
    {
      label: i18n.t('application-menu.help.source-code'),
      click: () => { AppController.openExternal(ExternalURL.Repository) }
    },
    {
      label: i18n.t('application-menu.help.report-issue'),
      click: () => { AppController.openExternal(ExternalURL.Issues) }
    },
  ]
  if (!isMac) {
    helpSubmenu.push(separator)
    helpSubmenu.push({
      id: 'preference',
      label: i18n.t('application-menu.help.settings'),
      click: () => { AppController.showPreference() }
    })
    helpSubmenu.push({
      label: i18n.t('application-menu.neuron.check-updates'),
      click: (menuItem: MenuItem) => { AppController.checkUpdates(menuItem) }
    })
    helpSubmenu.push({
      id: 'about',
      label: i18n.t('application-menu.neuron.about', {
        app: app.getName(),
      }),
      role: 'about',
      click: () => { AppController.showAbout() }
    })
  }

  const helpMenuItem: MenuItemConstructorOptions = {
    id: 'help',
    label: i18n.t('application-menu.help.label'),
    role: 'help',
    submenu: helpSubmenu,
  }

  const developMenuItem: MenuItemConstructorOptions = {
    id: 'develop',
    label: i18n.t('application-menu.develop.develop'),
    submenu: [
      {
        label: i18n.t('application-menu.develop.reload'),
        role: 'reload',
      },
      {
        label: i18n.t('application-menu.develop.force-reload'),
        role: 'forceReload',
      },
      {
        label: i18n.t('application-menu.develop.toggle-dev-tools'),
        role: 'toggleDevTools',
      },
    ],
  }

  const applicationMenuTemplate = env.isDevMode
    ? [walletMenuItem, editMenuItem, viewMenuItem, developMenuItem, windowMenuItem, helpMenuItem]
    : [walletMenuItem, editMenuItem, viewMenuItem, windowMenuItem, helpMenuItem]

  if (isMac) {
    applicationMenuTemplate.unshift(appMenuItem)
  }
  return applicationMenuTemplate
}

const contextMenuTemplate: {
  [key: string]: (id: string) => Promise<MenuItemConstructorOptions[]>
} = {
  copyMainnetAddress: async (identifier: string) => {
    const address = bech32Address(identifier, {
      prefix: AddressPrefix.Mainnet,
      type: AddressType.HashIdx,
      codeHashIndex: '0x00',
    })
    return [
      {
        label: i18n.t('contextMenu.copy-address'),
        click: () => { clipboard.writeText(address) }
      },
    ]
  },
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
        click: () => { AppController.navTo(`/network/${id}`) }
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
        click: async () => { walletsService.requestPassword(id, 'backup-wallet') }
      },
      {
        label: i18n.t('contextMenu.edit'),
        click: () => { AppController.navTo(`/editwallet/${id}`) }
      },
      {
        label: i18n.t('contextMenu.delete'),
        click: async () => { walletsService.requestPassword(id, 'delete-wallet') }
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
        click: () => { clipboard.writeText(address) }
      },
      {
        label: i18n.t('contextMenu.request-payment'),
        click: () => { AppController.navTo(`/receive/${address}`) }
      },
      {
        label: i18n.t('contextMenu.view-on-explorer'),
        click: () => { AppController.openExternal(`${env.explorer}/address/${address}`) }
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
        click: () => { clipboard.writeText(hash) }
      },
      {
        label: i18n.t('contextMenu.view-on-explorer'),
        click: () => { AppController.openExternal(`${env.explorer}/transaction/${hash}`) }
      },
    ]
  },
}

const updateApplicationMenu = (wallets: Controller.Wallet[], id: string | null) => {
  const menu = Menu.buildFromTemplate(generateTemplate())
  const selectMenu = menu.getMenuItemById('select')

  wallets.forEach(wallet => {
    selectMenu.submenu.append(
      new MenuItem({
        id: wallet.id,
        label: wallet.name,
        type: 'radio',
        checked: wallet.id === id,
        click: () => {
          const walletsService = WalletsService.getInstance()
          walletsService.setCurrent(wallet.id)
        },
      })
    )
  })

  Menu.setApplicationMenu(menu)
}

const popContextMenu = async (params: { type: string; id: string }) => {
  if (!params || params.id === undefined) {
    return
  }
  const { id, type } = params
  switch (type) {
    case 'copyMainnetAddress':
    case 'networkList':
    case 'walletList':
    case 'addressList':
    case 'transactionList': {
      const menu = Menu.buildFromTemplate(await contextMenuTemplate[type](id))
      menu.popup()
      break
    }
    default: {
      break
    }
  }
}

export { updateApplicationMenu, popContextMenu }
