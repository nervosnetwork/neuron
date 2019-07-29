import { Menu, MenuItem, MenuItemConstructorOptions } from 'electron'
import app from '../app'
import env from '../env'
import i18n from './i18n'
import AppController from '../controllers/app'
import WalletsService from '../services/wallets'

const isMac = process.platform === 'darwin'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

export const appMenuItem: MenuItemConstructorOptions = {
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

export const walletMenuItem: MenuItemConstructorOptions = {
  id: 'wallet',
  label: 'Wallet',
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
      click: () => {
        if (AppController) {
          AppController.importWallet()
        }
      },
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

export const editMenuItem: MenuItemConstructorOptions = {
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
  ],
}

export const viewMenuItem: MenuItemConstructorOptions = {
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

export const windowMenuItem: MenuItemConstructorOptions = {
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
        AppController.openWebsite()
      }
    },
  },
  {
    label: i18n.t('application-menu.help.sourceCode'),
    click: () => {
      if (AppController) {
        AppController.openRepository()
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

export const helpMenuItem: MenuItemConstructorOptions = {
  id: 'help',
  label: i18n.t('application-menu.help.label'),
  role: 'help',
  submenu: helpSubmenu,
}

export const developMenuItem: MenuItemConstructorOptions = {
  id: 'develop',
  label: i18n.t('application-menu.develop.develop'),
  submenu: [
    {
      label: i18n.t('application-menu.develop.reload'),
      role: 'reload',
    },
    {
      label: i18n.t('application-menu.develop.force-reload'),
      role: 'forceReload' as 'forcereload',
    },
    {
      label: i18n.t('application-menu.develop.toggle-dev-tools'),
      role: 'toggleDevTools' as 'toggledevtools',
    },
  ],
}

export const applicationMenuTemplate = env.isDevMode
  ? [walletMenuItem, editMenuItem, viewMenuItem, developMenuItem, windowMenuItem, helpMenuItem]
  : [walletMenuItem, editMenuItem, viewMenuItem, windowMenuItem, helpMenuItem]

if (isMac) {
  applicationMenuTemplate.unshift(appMenuItem)
}

export const updateApplicationMenu = (wallets: Controller.Wallet[], id: string | null) => {
  const applicationMenu = Menu.buildFromTemplate(applicationMenuTemplate)
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

export default {
  applicationMenuTemplate,
  updateApplicationMenu,
}
