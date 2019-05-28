import { app, dialog, shell, Menu, MessageBoxOptions } from 'electron'
import { Channel, ResponseCode } from '../../utils/const'
import windowManage from '../../utils/windowManage'
import { URL, contextMenuTemplate } from './options'

class AppController {
  public static showMessageBox(
    options: MessageBoxOptions,
    callback: (response: number, checkboxChecked: boolean) => void = () => {},
  ) {
    dialog.showMessageBox(options, callback)
  }

  public static navTo(path: string) {
    windowManage.sendToFocusedWindow(Channel.NavTo, '', {
      status: ResponseCode.Success,
      result: path,
    })
  }

  public static setUILocale(locale: string) {
    windowManage.broadcast(Channel.SetLanguage, '', {
      status: ResponseCode.Success,
      result: locale,
    })
  }

  public static openExternal(url: string) {
    shell.openExternal(url)
  }

  public static async contextMenu(params: { type: string; id: string }) {
    if (!params || params.id === undefined) return
    const { id, type } = params
    switch (type) {
      case 'networkList':
      case 'walletList':
      case 'addressList':
      case 'transactionList': {
        const menu = Menu.buildFromTemplate(await contextMenuTemplate[type](id))
        menu.popup()
        break
      }
      default: {
        break
      }
    }
  }

  public static showAbout() {
    const options = {
      type: 'info',
      title: app.getName(),
      message: app.getName(),
      detail: app.getVersion(),
      buttons: ['OK'],
      cancelId: 0,
    }
    AppController.showMessageBox(options)
  }

  public static openWebsite() {
    AppController.openExternal(URL.Website)
  }

  public static openRepository() {
    AppController.openExternal(URL.Repository)
  }

  public static showPreference() {
    AppController.navTo(URL.Preference)
  }

  public static showTerminal() {
    AppController.navTo(URL.Terminal)
  }
}

export default AppController
