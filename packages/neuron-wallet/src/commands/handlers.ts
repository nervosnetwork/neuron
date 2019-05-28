import { app, dialog, shell, BrowserWindow } from 'electron'
import Command from './commands'
import AppController from '../controllers/app'

export interface CommandInfo {
  window?: BrowserWindow
  extra?: { [index: string]: any }
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
  switch (command) {
    case Command.ShowPreferences: {
      AppController.navTo('/settings/general')
      break
    }
    case Command.ShowTerminal: {
      AppController.navTo('/terminal')

      break
    }
    case Command.SetUILocale: {
      AppController.setUILocale(info!.extra!.locale)
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
