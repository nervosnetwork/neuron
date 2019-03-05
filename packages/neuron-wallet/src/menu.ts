import { app, shell, Menu, MenuItem, MenuItemConstructorOptions, dialog, BrowserWindow } from 'electron'
import { Channel, Routes } from './utils/const'
import env from './env'
import i18n from './i18n'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const options = {
  type: 'info',
  title: app.getName(),
  message: app.getName(),
  detail: app.getVersion(),
  buttons: ['OK'],
  cancelId: 0,
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
          click: () => {
            dialog.showMessageBox(options)
          },
        },
        separator,
        {
          label: i18n.t('mainmenu.neuron.preferences'),
          accelerator: 'CmdOrCtrl+,',
          click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
            browserWindow.webContents.send(Channel.NavTo, {
              status: 1,
              result: {
                router: Routes.Settings,
              },
            })
          },
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
      role: 'editMenu',
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
      label: i18n.t('mainmenu.window.label'),
      role: 'windowMenu',
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
          click: () => {
            shell.openExternal('https://www.nervos.org/')
          },
        },
        {
          label: 'Source Code',
          click: () => {
            shell.openExternal('https://github.com/nervosnetwork/neuron')
          },
        },
      ],
    },
  ]

  if (env.isDevMode) {
    menuTemplate.push({
      label: 'Develop',
      submenu: [
        {
          role: 'reload',
        },
        {
          role: 'forceReload',
        },
        {
          role: 'toggleDevTools',
        },
      ],
    })
  }

  return menuTemplate
}

export default (): Menu => {
  return Menu.buildFromTemplate(getMenuTemplate())
}
