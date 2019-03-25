import { app, dialog, shell, BrowserWindow } from 'electron'
import Command from './commands'
import WalletChannel from '../channel'

export interface CommandInfo {
  channel: WalletChannel
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
      if (info) {
        info.channel.navTo('/settings/general')
      }
      break
    }
    case Command.ShowTerminal: {
      if (info) {
        info.channel.navTo('/terminal')
      }

      break
    }
    case Command.SetUILocale: {
      if (info) {
        info.channel.setUILocale(info!.extra!.locale)
      }
      break
    }
    case Command.SendWallet: {
      if (info) {
        info.channel.sendWallet()
      }
      break
    }
    case Command.SendTransactionHistory: {
      if (info && info.extra && info.extra.pageNo && info.extra.pageSize && info.extra.addresses) {
        info.channel.sendTransactionHistory({
          pageNo: +info.extra.pageNo,
          pageSize: +info.extra.pageSize,
          addresses: info.extra.addresses,
        })
      }
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
