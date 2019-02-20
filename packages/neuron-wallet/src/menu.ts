import { app, shell, Menu, MenuItemConstructorOptions } from 'electron'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      {
        role: 'about',
      },
      separator,
      {
        label: 'Preferences...',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // TODO: show preferences view
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

const { NODE_ENV } = process.env
if (NODE_ENV === 'development') {
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
