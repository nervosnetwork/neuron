import { BrowserWindow, Menu, MenuItem, MenuItemConstructorOptions } from 'electron'

const separator: MenuItemConstructorOptions = {
  type: 'separator',
}

const menuTemplate = [
  {
    label: 'Neuron',
    submenu: [
      {
        label: 'About Neuron',
        click: () => {
          // TODO: show about dialog
        },
      },
      separator,
      {
        label: 'Preferences',
        accelerator: 'CmdOrCtrl+,',
        click: () => {
          // TODO: show preferences view
        },
      },
      separator,
      {
        label: 'Quit Neuron',
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit',
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      {
        label: 'Cut',
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: 'Copy',
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: 'Paste',
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
    ],
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Close Window',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
      separator,
      {
        label: 'Bring All to Front',
        click: (_menuItem: MenuItem, browserWindow: BrowserWindow) => {
          browserWindow.focus()
        },
      },
    ],
  },
]

export default Menu.buildFromTemplate(menuTemplate)
