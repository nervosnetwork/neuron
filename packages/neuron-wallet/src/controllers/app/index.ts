import { Channel, ResponseCode } from '../../utils/const'
import windowManage from '../../utils/windowManage'

class AppController {
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
}

export default AppController
