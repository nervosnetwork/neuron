import { app, shell, BrowserWindow, dialog, MenuItemConstructorOptions, clipboard, Menu, MenuItem, MessageBoxOptions, MessageBoxReturnValue } from 'electron'
import { bech32Address, AddressPrefix, AddressType } from '@nervosnetwork/ckb-sdk-utils'
import i18n from 'utils/i18n'
import env from 'env'
import { UpdateController } from 'controllers'
import { showWindow } from './show-window'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import CommandSubject from 'models/subjects/command'

enum URL {
  Preference = '/settings/general',
  CreateWallet = '/wizard/mnemonic/create',
  ImportMnemonic = '/wizard/mnemonic/import',
  ImportKeystore = '/keystore/import',
}

enum ExternalURL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Issues = 'https://github.com/nervosnetwork/neuron/issues',
}

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const showMessageBox = (options: MessageBoxOptions, callback?: (returnValue: MessageBoxReturnValue) => void) => {
  dialog.showMessageBox(options).then(callback)
}

const showAbout = () => {
  const options = {
    type: 'info',
    title: app.getName(),
    message: app.getName(),
    detail: app.getVersion(),
    buttons: ['OK'],
    cancelId: 0,
  }
  dialog.showMessageBox(options)
}

const navTo = (url: string) => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    CommandSubject.next({ winID: window.id, type: 'nav', payload: url })
  }
}

const requestPassword = (walletID: string, actionType: 'delete-wallet' | 'backup-wallet') => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    CommandSubject.next({ winID: window.id, type: actionType, payload: walletID })
  }
}

const updateApplicationMenu = (mainWindow: BrowserWindow | null) => {
  const isMac = process.platform === 'darwin'
  let isMainWindow = mainWindow == BrowserWindow.getFocusedWindow()

  const walletsService = WalletsService.getInstance()
  const wallets = walletsService.getAll().map(({ id, name }) => ({ id, name }))
  const currentWallet = walletsService.getCurrent()
  const hasCurrentWallet = currentWallet !== undefined

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
        click: () => { showAbout() },
      },
      {
        enabled: isMainWindow,
        label: i18n.t('application-menu.neuron.check-updates'),
        click: (menuItem: MenuItem) => {
           new UpdateController().checkUpdates(menuItem)
           navTo(URL.Preference)
         }
      },
      separator,
      {
        id: 'preference',
        enabled: isMainWindow,
        label: i18n.t('application-menu.neuron.preferences'),
        accelerator: 'CmdOrCtrl+,',
        click: () => { navTo(URL.Preference) }
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

  const selectWalletMenu: MenuItemConstructorOptions[] = wallets.map(wallet => {
    return {
      id: wallet.id,
      label: wallet.name,
      type: 'radio',
      checked: currentWallet && wallet.id === currentWallet.id,
      click: () => { WalletsService.getInstance().setCurrent(wallet.id) }
    }
  })

  const walletMenuItem: MenuItemConstructorOptions = {
    id: 'wallet',
    label: i18n.t('application-menu.wallet.label'),
    enabled: isMainWindow,
    submenu: [
      { id: 'select', label: i18n.t('application-menu.wallet.select'), submenu: selectWalletMenu },
      {
        id: 'create',
        label: i18n.t('application-menu.wallet.create-new'),
        click: () => { navTo(URL.CreateWallet) }
      },
      {
        id: 'import',
        label: i18n.t('application-menu.wallet.import'),
        submenu: [
          {
            id: 'import-with-mnemonic',
            label: i18n.t('application-menu.wallet.import-mnemonic'),
            click: () => { navTo(URL.ImportMnemonic) }
          },
          {
            id: 'import-with-keystore',
            label: i18n.t('application-menu.wallet.import-keystore'),
            click: () => { navTo(URL.ImportKeystore )},
          },
        ],
      },
      separator,
      {
        id: 'backup',
        label: i18n.t('application-menu.wallet.backup'),
        enabled: hasCurrentWallet,
        click: () => {
          if (!currentWallet) {
            return
          }
          requestPassword(currentWallet.id, 'backup-wallet')
        },
      },
      {
        id: 'delete',
        label: i18n.t('application-menu.wallet.delete'),
        enabled: hasCurrentWallet,
        click: () => {
          if (!currentWallet) {
            return
          }
          requestPassword(currentWallet.id, 'delete-wallet')
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

  const windowMenuItem: MenuItemConstructorOptions = {
    id: 'window',
    label: i18n.t('application-menu.window.label'),
    role: 'window',
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
      label: i18n.t('application-menu.help.nervos-website'),
      click: () => { shell.openExternal(ExternalURL.Website) }
    },
    {
      label: i18n.t('application-menu.help.source-code'),
      click: () => { shell.openExternal(ExternalURL.Repository) }
    },
    {
      label: i18n.t('application-menu.help.report-issue'),
      click: () => { shell.openExternal(ExternalURL.Issues) }
    },
  ]
  if (!isMac) {
    helpSubmenu.push(separator)
    helpSubmenu.push({
      id: 'preference',
      label: i18n.t('application-menu.help.settings'),
      click: () => { navTo(URL.Preference) }
    })
    helpSubmenu.push({
      label: i18n.t('application-menu.neuron.check-updates'),
      click: (menuItem: MenuItem) => {
        new UpdateController().checkUpdates(menuItem)
        navTo(URL.Preference)
      }
    })
    helpSubmenu.push({
      id: 'about',
      label: i18n.t('application-menu.neuron.about', {
        app: app.getName(),
      }),
      role: 'about',
      click: () => { showAbout() }
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
    ? [walletMenuItem, editMenuItem, developMenuItem, windowMenuItem, helpMenuItem]
    : [walletMenuItem, editMenuItem, windowMenuItem, helpMenuItem]

  if (isMac) {
    applicationMenuTemplate.unshift(appMenuItem)
  }

  const menu = Menu.buildFromTemplate(applicationMenuTemplate)

  Menu.setApplicationMenu(menu)
}

const contextMenuTemplate: {
  [key: string]: (id: string) => Promise<MenuItemConstructorOptions[]>
} = {
  copyMainnetAddress: async (publicKeyHash: string) => {
    const address = bech32Address(publicKeyHash, {
      prefix: AddressPrefix.Mainnet,
      type: AddressType.HashIdx,
      codeHashOrCodeHashIndex: '0x00',
    })
    return [
      {
        label: i18n.t('contextMenu.copy-address'),
        click: () => { clipboard.writeText(address) }
      },
    ]
  },
  networkList: async (id: string) => {
    const networksService = NetworksService.getInstance()
    const network = networksService.get(id)
    const currentNetworkID = networksService.getCurrentID()

    if (!network) {
      showMessageBox({
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
            showMessageBox({
              type: 'error',
              message: err.message,
            })
          })
        },
      },
      {
        label: i18n.t('contextMenu.edit'),
        enabled: !isDefault,
        click: () => { navTo(`/network/${id}`) }
      },
      {
        label: i18n.t('contextMenu.delete'),
        enabled: !isDefault,
        cancelId: 1,
        click: async () => {
          showMessageBox(
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
      showMessageBox({
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
            showMessageBox({ type: 'error', message: err.message })
          }
        },
      },
      {
        label: i18n.t('contextMenu.backup'),
        click: async () => { requestPassword(id, 'backup-wallet') }
      },
      {
        label: i18n.t('contextMenu.edit'),
        click: () => { navTo(`/editwallet/${id}`) }
      },
      {
        label: i18n.t('contextMenu.delete'),
        click: async () => { requestPassword(id, 'delete-wallet') }
      },
    ]
  },
  addressList: async (identifier: string) => {
    if (identifier === undefined) {
      return []
    }

    const address = bech32Address(identifier, {
      prefix: NetworksService.getInstance().isMainnet() ? AddressPrefix.Mainnet : AddressPrefix.Testnet,
      type: AddressType.HashIdx,
      codeHashOrCodeHashIndex: '0x00',
    })
    return [
      {
        label: i18n.t('contextMenu.copy-address'),
        click: () => { clipboard.writeText(address) }
      },
      {
        label: i18n.t('contextMenu.request-payment'),
        click: () => { navTo(`/receive/${address}`) }
      },
      {
        label: i18n.t('contextMenu.view-on-explorer'),
        click: () => { shell.openExternal(`${NetworksService.getInstance().explorerUrl()}/address/${address}`) }
      },
    ]
  },
  transactionList: async (hash: string) => {
    return [
      {
        label: i18n.t('contextMenu.detail'),
        click: () => {
          showWindow(`${env.mainURL}#/transaction/${hash}`, i18n.t(`messageBox.transaction.title`, { hash }))
        }
      },
      {
        label: i18n.t('contextMenu.copy-transaction-hash'),
        click: () => { clipboard.writeText(hash) }
      },
      {
        label: i18n.t('contextMenu.view-on-explorer'),
        click: () => { shell.openExternal(`${NetworksService.getInstance().explorerUrl()}/transaction/${hash}`) }
      },
    ]
  },
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
