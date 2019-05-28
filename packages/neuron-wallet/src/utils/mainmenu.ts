import { app, Menu, MenuItemConstructorOptions } from 'electron'
import env from '../env'
import dispatch, { Command } from '../commands/dispatcher'
import i18n from './i18n'

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
          click: () => {
            dispatch(Command.ShowAbout)
          },
        },
        separator,
        {
          label: i18n.t('mainmenu.neuron.preferences'),
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            dispatch(Command.ShowPreferences)
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
          click: () => {
            dispatch(Command.OpenNervosWebsite)
          },
        },
        {
          label: i18n.t('mainmenu.help.sourceCode'),
          click: () => {
            dispatch(Command.OpenSourceCodeReposity)
          },
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
        {
          label: i18n.t('mainmenu.develop.terminal'),
          accelerator: 'Cmd+Shift+t',
          click: () => {
            dispatch(Command.ShowTerminal)
          },
        },
      ],
    } as MenuItemConstructorOptions)
  }

  return menuTemplate
}

export default (): Menu => {
  return Menu.buildFromTemplate(getMenuTemplate())
}
