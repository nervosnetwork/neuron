import { app, dialog, shell, BrowserWindow } from 'electron'
import Command from './commands'
import { Channel } from '../utils/const'

export interface CommandInfo {
  window?: BrowserWindow
  extra?: any
}
type Handler = (command: Command | null, info: CommandInfo | null) => void

const aboutHandler: Handler = () => {
  const options = {
    type: 'info',
    title: app.getName(),
    message: app.getName(),
    detail: app.getVersion(),
    buttons: ['OK'],
    cancelId: 0,
  }
  dialog.showMessageBox(options)
}

const externalUrlHandler: Handler = command => {
  switch (command) {
    case Command.OpenNervosWebsite: {
      shell.openExternal('https://www.nervos.org/')
      break
    }
    case Command.OpenSourceCodeReposity: {
      shell.openExternal('https://github.com/nervosnetwork/neuron')
      break
    }
    default:
      break
  }
}

const rendererMessageHandler: Handler = (command, info) => {
  const window: BrowserWindow = info!.window!
  switch (command) {
    case Command.ShowPreferences: {
      window.webContents.send(Channel.NavTo, {
        status: 1,
        result: {
          router: '/settings/general',
        },
      })
      break
    }
    case Command.ShowTerminal: {
      window.webContents.send(Channel.NavTo, {
        status: 1,
        result: {
          router: '/terminal',
        },
      })
      break
    }
    case Command.SetUILocale: {
      window.webContents.send(Channel.SetLanguage, info!.extra!.locale)
      break
    }
    default:
      break
  }
}

export default {
  aboutHandler,
  externalUrlHandler,
  rendererMessageHandler,
}
