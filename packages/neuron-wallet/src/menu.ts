import { app, Menu, MenuItem, MenuItemConstructorOptions, BrowserWindow } from 'electron'
import env from './env'
import dispatch from './commands/dispatcher'
import Command from './commands/commands'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      {
        role: 'about',
        click: () => {
          dispatch(Command.ShowAbout)
        },
      },
      separator,
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
          dispatch(Command.ShowPreferences, {
            window: browserWindow,
          })
        },
      },
      separator,
      {
        role: 'quit',
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        role: 'cut',
      },
      {
        role: 'copy',
      },
      {
        role: 'paste',
      },
    ],
  },
  {
    role: 'windowMenu',
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Nervos',
        click: () => {
          dispatch(Command.OpenNervosWebsite)
        },
      },
      {
        label: 'Source Code',
        click: () => {
          dispatch(Command.OpenSourceCodeReposity)
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

export default Menu.buildFromTemplate(menuTemplate)
