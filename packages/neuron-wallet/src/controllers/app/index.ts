import { app, dialog, shell } from 'electron'
import { Channel, ResponseCode } from '../../utils/const'
import windowManage from '../../utils/windowManage'
import { URL } from './options'

class AppController {
  public static showMessageBox(options: any) {
    dialog.showMessageBox(options)
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
