import { app, shell, Menu, MenuItemConstructorOptions, dialog } from 'electron'

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

const menuTemplate = [
  {
    label: app.getName(),
    submenu: [
      {
        role: 'about',
        click: () => {
          dialog.showMessageBox(options)
        },
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
