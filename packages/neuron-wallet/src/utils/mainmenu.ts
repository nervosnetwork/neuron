import { app, Menu, MenuItemConstructorOptions } from 'electron'
import env from '../env'
import i18n from './i18n'
import AppController from '../controllers/app'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const getMenuTemplate = () => {
  const menuTemplate: MenuItemConstructorOptions[] = [
    {
      label: app.getName(),
      submenu: [
        {
          label: i18n.t('mainmenu.neuron.about', {
            app: app.getName(),
          }),
          role: 'about',
          click: AppController.showAbout,
        },
        separator,
        {
          label: i18n.t('mainmenu.neuron.preferences'),
          accelerator: 'CmdOrCtrl+,',
          click: AppController.showPreference,
        },
        separator,
        {
          label: i18n.t('mainmenu.neuron.quit', {
            app: app.getName(),
          }),
          role: 'quit',
        },
      ],
    },
    {
      label: i18n.t('mainmenu.edit.label'),
      submenu: [
        {
          label: i18n.t('mainmenu.edit.cut'),
          role: 'cut',
        },
        {
          label: i18n.t('mainmenu.edit.copy'),
          role: 'copy',
        },
        {
          label: i18n.t('mainmenu.edit.paste'),
          role: 'paste',
        },
      ],
    },
    {
      label: i18n.t('mainmenu.view.label'),
      submenu: [
        {
          label: i18n.t('mainmenu.view.fullscreen'),
          role: 'togglefullscreen',
        },
      ],
    },
    {
      label: i18n.t('mainmenu.window.label'),
      submenu: [
        {
          label: i18n.t('mainmenu.window.minimize'),
          role: 'minimize',
        },
        {
          label: i18n.t('mainmenu.window.close'),
          role: 'close',
        },
      ],
    },
    {
      label: i18n.t('mainmenu.help.label'),
      role: 'help',
      submenu: [
        {
          label: 'Nervos',
          click: AppController.openWebsite,
        },
        {
          label: i18n.t('mainmenu.help.sourceCode'),
          click: AppController.openRepository,
        },
      ],
    },
  ]

  if (env.isDevMode) {
    menuTemplate.push({
      label: i18n.t('mainmenu.develop.develop'),
      submenu: [
        {
          label: i18n.t('mainmenu.develop.reload'),
          role: 'reload',
        },
        {
          label: i18n.t('mainmenu.develop.forceReload'),
          role: 'forceReload',
        },
        {
          label: i18n.t('mainmenu.develop.toggleDevTools'),
          role: 'toggleDevTools',
        },
      ],
    } as MenuItemConstructorOptions)
  }

  return menuTemplate
}

export default (): Menu => {
  return Menu.buildFromTemplate(getMenuTemplate())
}
