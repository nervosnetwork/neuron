import { app, Menu, MenuItemConstructorOptions } from 'electron'
import env from '../env'
import i18n from './i18n'
import AppController from '../controllers/app'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const applicationMenuTemplate: MenuItemConstructorOptions[] = [
  {
    label: app.getName(),
    submenu: [
      {
        label: i18n.t('application-menu.neuron.about', {
          app: app.getName(),
        }),
        role: 'about',
        click: AppController.showAbout,
      },
      separator,
      {
        label: i18n.t('application-menu.neuron.preferences'),
        accelerator: 'CmdOrCtrl+,',
        click: AppController.showPreference,
      },
      separator,
      {
        label: i18n.t('application-menu.neuron.quit', {
          app: app.getName(),
        }),
        role: 'quit',
      },
    ],
  },
  {
    label: 'Wallet',
    submenu: [
      { label: i18n.t('application-menu.wallet.select'), submenu: [] },
      { label: i18n.t('application-menu.wallet.create-new'), click: AppController.createWallet },
      { label: i18n.t('application-menu.wallet.import'), click: AppController.importWallet },
      separator,
      { label: i18n.t('application-menu.wallet.backup'), click: AppController.backupCurrentWallet },
      { label: i18n.t('application-menu.wallet.delete'), click: AppController.deleteCurrentWallet },
      { label: i18n.t('application-menu.wallet.change-password') },
    ],
  },
  {
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
  },
  {
    label: i18n.t('application-menu.view.label'),
    submenu: [
      {
        label: i18n.t('application-menu.view.fullscreen'),
        role: 'togglefullscreen',
      },
      {
        label: i18n.t('application-menu.view.address-book'),
        click: AppController.toggleAddressBook,
        accelerator: 'CmdOrCtrl+B',
      },
    ],
  },
  {
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
  },
  {
    label: i18n.t('application-menu.help.label'),
    role: 'help',
    submenu: [
      {
        label: 'Nervos',
        click: AppController.openWebsite,
      },
      {
        label: i18n.t('application-menu.help.sourceCode'),
        click: AppController.openRepository,
      },
    ],
  },
  {
    label: i18n.t('application-menu.develop.develop'),
    visible: env.isDevMode,
    submenu: [
      {
        label: i18n.t('application-menu.develop.reload'),
        role: 'reload',
      },
      {
        label: i18n.t('application-menu.develop.forceReload'),
        role: 'forceReload' as 'forcereload',
      },
      {
        label: i18n.t('application-menu.develop.toggleDevTools'),
        role: 'toggleDevTools' as 'toggledevtools',
      },
    ],
  },
]

export default Menu.buildFromTemplate(applicationMenuTemplate)
