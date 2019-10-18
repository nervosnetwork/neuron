import path from 'path'
import {
  dialog,
  shell,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  clipboard,
  MessageBoxOptions,
  MessageBoxReturnValue,
  BrowserWindow,
} from 'electron'
import windowStateKeeper from 'electron-window-state'
import { take } from 'rxjs/operators'
import { bech32Address, AddressPrefix, AddressType } from '@nervosnetwork/ckb-sdk-utils'

import app from 'app'
import { TransactionsController, WalletsController, SyncInfoController, UpdateController } from 'controllers'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import SkipDataAndType from 'services/settings/skip-data-and-type'

import { ResponseCode } from 'utils/const'
import logger from 'utils/logger'
import i18n from 'utils/i18n'
import env from 'env'
import CommandSubject from 'models/subjects/command'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { SystemScriptSubject } from 'models/subjects/system-script'

import { subscribe } from './subscribe'

const isMac = process.platform === 'darwin'
const networksService = NetworksService.getInstance()

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
        click: () => {
          if (AppController) {
            AppController.showAbout()
          }
        },
      },
      {
        label: i18n.t('application-menu.neuron.check-updates'),
        click: (menuItem: MenuItem) => {
          if (AppController) {
            AppController.checkUpdates(menuItem)
          }
        },
      },
      separator,
      {
        id: 'preference',
        label: i18n.t('application-menu.neuron.preferences'),
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          if (AppController) {
            AppController.showPreference()
          }
        },
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
        click: () => {
          if (AppController) {
            AppController.createWallet()
          }
        },
      },
      {
        id: 'import',
        label: i18n.t('application-menu.wallet.import'),
        submenu: [
          {
            id: 'import-with-mnemonic',
            label: i18n.t('application-menu.wallet.import-mnemonic'),
            click: () => {
              if (AppController) {
                AppController.importWallet('mnemonic')
              }
            },
          },
          {
            id: 'import-with-keystore',
            label: i18n.t('application-menu.wallet.import-keystore'),
            click: () => {
              if (AppController) {
                AppController.importWallet('keystore')
              }
            },
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
            // TODO: show the error message
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
            // TODO: show the error message
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
        click: () => {
          if (AppController) {
            AppController.toggleAddressBook()
          }
        },
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
      click: () => {
        if (AppController) {
          AppController.openExternal(ExternalURL.Website)
        }
      },
    },
    {
      label: i18n.t('application-menu.help.source-code'),
      click: () => {
        if (AppController) {
          AppController.openExternal(ExternalURL.Repository)
        }
      },
    },
    {
      label: i18n.t('application-menu.help.report-issue'),
      click: () => {
        if (AppController) {
          AppController.openExternal(ExternalURL.Issues)
        }
      },
    },
  ]
  if (!isMac) {
    helpSubmenu.push(separator)
    helpSubmenu.push({
      id: 'preference',
      label: i18n.t('application-menu.help.settings'),
      click: () => {
        if (AppController) {
          AppController.showPreference()
        }
      },
    })
    helpSubmenu.push({
      label: i18n.t('application-menu.neuron.check-updates'),
      click: (menuItem: MenuItem) => {
        if (AppController) {
          AppController.checkUpdates(menuItem)
        }
      },
    })
    helpSubmenu.push({
      id: 'about',
      label: i18n.t('application-menu.neuron.about', {
        app: app.getName(),
      }),
      role: 'about',
      click: () => {
        if (AppController) {
          AppController.showAbout()
        }
      },
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
        click: () => {
          clipboard.writeText(address)
        },
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

// Acts as a middle man so that subscribe doesn't have to know AppController
const messageDispatcher = {
  sendMessage: (channel: string, obj: any) => {
    AppController.sendMessage(channel, obj)
  }
}
subscribe(messageDispatcher)

export default class AppController {
  public static mainWindow: BrowserWindow | null

  public static sendMessage = (channel: string, obj: any) => {
    if (AppController.mainWindow) {
      AppController.mainWindow.webContents.send(channel, obj)
    }
  }

  public static openWindow = () => {
    if (AppController.mainWindow) {
      return
    }

    AppController.mainWindow = AppController.createWindow()
    AppController.mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
      if (AppController.mainWindow) {
        AppController.mainWindow.removeAllListeners()
        AppController.mainWindow = null
      }
    })
  }

  static createWindow = () => {
    const windowState = windowStateKeeper({
      defaultWidth: 1366,
      defaultHeight: 768,
    })

    AppController.mainWindow = new BrowserWindow({
      x: windowState.x,
      y: windowState.y,
      width: windowState.width,
      height: windowState.height,
      minWidth: 800,
      minHeight: 600,
      show: false,
      backgroundColor: '#e9ecef',
      icon: path.join(__dirname, '../../neuron-ui/icon.png'),
      webPreferences: {
        devTools: env.isDevMode,
        nodeIntegration: env.isDevMode || env.isTestMode,
        preload: path.join(__dirname, './preload.js'),
      },
    })

    windowState.manage(AppController.mainWindow)

    AppController.mainWindow.loadURL(env.mainURL)

    AppController.mainWindow.on('ready-to-show', () => {
      if (AppController.mainWindow) {
        AppController.mainWindow.show()
        AppController.mainWindow.focus()
        logger.info('The main window is ready to show')
      } else {
        logger.error('The main window is not initialized on ready to show')
      }
    })

    return AppController.mainWindow
  }

  public static getInitState = async () => {
    const walletsService = WalletsService.getInstance()
    const networksService = NetworksService.getInstance()
    const [
      currentWallet = null,
      wallets = [],
      currentNetworkID = '',
      networks = [],
      syncedBlockNumber = '0',
      connectionStatus = false,
      codeHash = '',
    ] = await Promise.all([
      walletsService.getCurrent(),
      walletsService.getAll(),
      networksService.getCurrentID(),
      networksService.getAll(),

      SyncInfoController.currentBlockNumber()
        .then(res => {
          if (res.status) {
            return res.result.currentBlockNumber
          }
          return '0'
        })
        .catch(() => '0'),
      new Promise(resolve => {
        ConnectionStatusSubject.pipe(take(1)).subscribe(
          status => {
            resolve(status)
          },
          () => {
            resolve(false)
          },
        )
      }),
      new Promise(resolve => {
        SystemScriptSubject.pipe(take(1)).subscribe(({ codeHash: currentCodeHash }) => resolve(currentCodeHash))
      }),
    ])

    const minerAddresses = await Promise.all(
      wallets.map(({ id }) =>
        WalletsController.getAllAddresses(id).then(addrRes => {
          if (addrRes.result) {
            const minerAddr = addrRes.result.find(addr => addr.type === 0 && addr.index === 0)
            if (minerAddr) {
              return {
                address: minerAddr.address,
                identifier: minerAddr.identifier,
              }
            }
          }
          return undefined
        }),
      ),
    )
    const addresses: Controller.Address[] = await (currentWallet
      ? WalletsController.getAllAddresses(currentWallet.id).then(res => res.result)
      : [])

    const transactions = currentWallet
      ? await TransactionsController.getAllByKeywords({
          pageNo: 1,
          pageSize: 15,
          keywords: '',
          walletID: currentWallet.id,
        }).then(res => res.result)
      : []

    const skipDataAndType = SkipDataAndType.getInstance().get()

    const initState = {
      currentWallet,
      wallets: [...wallets.map(({ name, id }, idx: number) => ({ id, name, minerAddress: minerAddresses[idx] }))],
      currentNetworkID,
      networks,
      addresses,
      transactions,
      syncedBlockNumber,
      connectionStatus,
      codeHash,
      skipDataAndType,
    }

    return { status: ResponseCode.Success, result: initState }
  }

  public static handleViewError = (error: string) => {
    if (env.isDevMode) {
      console.error(error)
    }
  }

  public static isMainWindow = (winID: number) => {
    return AppController.mainWindow && winID === AppController.mainWindow.id
  }

  public static showMessageBox(options: MessageBoxOptions, callback?: (returnValue: MessageBoxReturnValue) => void) {
    dialog.showMessageBox(options).then(callback)
  }

  public static updateApplicationMenu = (wallets: Controller.Wallet[], id: string | null) => {
    const applicationMenu = Menu.buildFromTemplate(generateTemplate())
    const selectMenu = applicationMenu.getMenuItemById('select')

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

    Menu.setApplicationMenu(applicationMenu)
  }

  public static toggleAddressBook() {
    if (AppController.mainWindow) {
      CommandSubject.next({
        winID: AppController.mainWindow.id,
        type: 'toggle-address-book',
        payload: null,
      })
    }
  }

  public static navTo(url: string) {
    if (AppController.mainWindow) {
      CommandSubject.next({ winID: AppController.mainWindow.id, type: 'nav', payload: url })
    }
  }

  public static openExternal(url: string) {
    shell.openExternal(url)
  }

  public static async contextMenu(params: { type: string; id: string }) {
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

  public static showAbout() {
    const options = {
      type: 'info',
      title: app.getName(),
      message: app.getName(),
      detail: app.getVersion(),
      buttons: ['OK'],
      cancelId: 0,
    }
    AppController.showMessageBox(options)
  }

  public static checkUpdates(menuItem: MenuItem) {
    new UpdateController().checkUpdates(menuItem)
  }

  public static showPreference() {
    AppController.navTo(URL.Preference)
  }

  public static createWallet() {
    AppController.navTo(URL.CreateWallet)
  }

  public static importWallet(type: 'mnemonic' | 'keystore') {
    if (type === 'mnemonic') {
      AppController.navTo(URL.ImportMnemonic)
    } else if (type === 'keystore') {
      AppController.navTo(URL.ImportKeystore)
    }
  }

  public static async showTransactionDetails(hash: string) {
    const win = new BrowserWindow({
      width: 1200,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, '../../startup/preload.js'),
      },
    })
    win.loadURL(`${env.mainURL}#/transaction/${hash}`)
    win.on('ready-to-show', () => {
      win.setTitle(i18n.t(`messageBox.transaction.title`, { hash }))
      win.show()
      win.focus()
    })
  }
}

/* eslint-disable */
declare global {
  module Controller {
    type AppMethod = Exclude<keyof typeof AppController, keyof typeof Object>
  }
}
/* eslint-enable */
