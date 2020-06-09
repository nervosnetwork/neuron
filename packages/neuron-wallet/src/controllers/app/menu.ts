import fs from 'fs'
import path from 'path'
import {
  app,
  shell,
  BrowserWindow,
  dialog,
  MenuItemConstructorOptions,
  Menu,
} from 'electron'
import { Subject } from 'rxjs'
import { throttleTime } from 'rxjs/operators'
import i18n from 'locales/i18n'
import env from 'env'
import UpdateController from 'controllers/update'
import ExportDebugController from 'controllers/export-debug'
import { showWindow } from 'controllers/app/show-window'
import WalletsService from 'services/wallets'
import CommandSubject from 'models/subjects/command'
import logger from 'utils/logger'
import { SETTINGS_WINDOW_TITLE } from 'utils/const'

enum URL {
  Settings = '/settings/general',
  CreateWallet = '/wizard/mnemonic/create',
  ImportMnemonic = '/wizard/mnemonic/import',
  ImportKeystore = '/keystore/import',
}

enum ExternalURL {
  Website = 'https://www.nervos.org/',
  Repository = 'https://github.com/nervosnetwork/neuron',
  Issues = 'https://github.com/nervosnetwork/neuron/issues',
  Doc = 'https://docs.nervos.org/tooling/neuron.html',
  Faq = 'https://docs.nervos.org/references/neuron-faq.html'
}

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const showAbout = () => {
  let applicationVersion = i18n.t('about.app-version', { name: app.name, version: app.getVersion() })

  const appPath = app.isPackaged ? app.getAppPath() : path.join(__dirname, '../../../../..')
  const ckbVersionPath = path.join(appPath, '.ckb-version')
  if (fs.existsSync(ckbVersionPath)) {
    try {
      const ckbVersion = fs.readFileSync(ckbVersionPath, 'utf8')
      applicationVersion += `\n${i18n.t('about.ckb-client-version', { version: ckbVersion })}`
    } catch (err) {
      logger.error(`[Menu]: `, err)
    }
  }

  const isWin = process.platform === 'win32'

  if (isWin) {
    const options = {
      type: 'info',
      title: app.name,
      message: app.name,
      detail: applicationVersion,
      buttons: ['OK'],
      cancelId: 0,
    }
    dialog.showMessageBox(options)
    return
  }

  app.setAboutPanelOptions({ applicationVersion, version: '' })
  app.showAboutPanel()
}

const navigateTo = (url: string) => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    CommandSubject.next({ winID: window.id, type: 'navigate-to-url', payload: url, dispatchToUI: true })
  }
}

const showSettings$ = new Subject()

showSettings$.pipe(throttleTime(1000)).subscribe(() => {
  showWindow(`#${URL.Settings}`, i18n.t(SETTINGS_WINDOW_TITLE))
})

const showSettings = () => {
  showSettings$.next()
}

const requestPassword = (walletID: string, actionType: 'delete-wallet' | 'backup-wallet') => {
  const window = BrowserWindow.getFocusedWindow()
  if (window) {
    CommandSubject.next({ winID: window.id, type: actionType, payload: walletID, dispatchToUI: false })
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
    label: app.name,
    submenu: [
      {
        id: 'about',
        label: i18n.t('application-menu.neuron.about', {
          app: app.name,
        }),
        click: () => { showAbout() },
      },
      {
        label: i18n.t('application-menu.neuron.check-updates'),
        enabled: isMainWindow && !UpdateController.isChecking,
        click: () => {
          new UpdateController().checkUpdates()
          showSettings()
        }
      },
      separator,
      {
        id: 'preference',
        enabled: isMainWindow,
        label: i18n.t('application-menu.neuron.preferences'),
        accelerator: 'CmdOrCtrl+,',
        click: showSettings
      },
      separator,
      {
        label: i18n.t('application-menu.neuron.quit', {
          app: app.name,
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
        click: () => { navigateTo(URL.CreateWallet) }
      },
      {
        id: 'import',
        label: i18n.t('application-menu.wallet.import'),
        submenu: [
          {
            id: 'import-with-mnemonic',
            label: i18n.t('application-menu.wallet.import-mnemonic'),
            click: () => { navigateTo(URL.ImportMnemonic) }
          },
          {
            id: 'import-with-keystore',
            label: i18n.t('application-menu.wallet.import-keystore'),
            click: () => { navigateTo(URL.ImportKeystore) }
          },
          {
            id: 'import-with-xpubkey',
            label: i18n.t('application-menu.wallet.import-xpubkey'),
            click: () => {
              const window = BrowserWindow.getFocusedWindow()
              if (window) {
                CommandSubject.next({ winID: window.id, type: 'import-xpubkey', payload: null, dispatchToUI: false })
              }
            }
          }
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
        id: 'export-xpubkey',
        label: i18n.t('application-menu.wallet.export-xpubkey'),
        enabled: hasCurrentWallet,
        click: () => {
          if (!currentWallet) {
            return
          }
          const window = BrowserWindow.getFocusedWindow()
          if (window) {
            CommandSubject.next({ winID: window.id, type: 'export-xpubkey', payload: currentWallet.id, dispatchToUI: false })
          }
        }
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

  const toolsMenuItem: MenuItemConstructorOptions = {
    id: 'tools',
    label: i18n.t('application-menu.tools.label'),
    submenu: [
      {
        label: i18n.t('application-menu.tools.sign-and-verify'),
        enabled: hasCurrentWallet,
        click: () => {
          const currentWallet = walletsService.getCurrent()
          showWindow(`#/sign-verify/${currentWallet!.id}`, i18n.t(`messageBox.sign-and-verify.title`))
        }
      }
    ]
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
      label: i18n.t('application-menu.help.documentation'),
      click: () => { shell.openExternal(ExternalURL.Doc) }
    },
    {
      label: i18n.t('application-menu.help.faq'),
      click: () => { shell.openExternal(ExternalURL.Faq) }
    },
    separator,
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
    {
      label: i18n.t("application-menu.help.export-debug-info"),
      click: () => { new ExportDebugController().export() }
    }
  ]
  if (!isMac) {
    helpSubmenu.push(separator)
    helpSubmenu.push({
      id: 'preference',
      label: i18n.t(SETTINGS_WINDOW_TITLE),
      click: showSettings,
    })
    helpSubmenu.push({
      label: i18n.t('application-menu.neuron.check-updates'),
      enabled: isMainWindow && !UpdateController.isChecking,
      click: () => {
        new UpdateController().checkUpdates()
        showSettings()
      }
    })
    helpSubmenu.push({
      id: 'about',
      label: i18n.t('application-menu.neuron.about', {
        app: app.name
      }),
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
    ? [walletMenuItem, editMenuItem, developMenuItem, toolsMenuItem, windowMenuItem, helpMenuItem]
    : [walletMenuItem, editMenuItem, toolsMenuItem, windowMenuItem, helpMenuItem]

  if (isMac) {
    applicationMenuTemplate.unshift(appMenuItem)
  }

  const menu = Menu.buildFromTemplate(applicationMenuTemplate)

  Menu.setApplicationMenu(menu)
}

export { updateApplicationMenu }
