import { BrowserWindow } from 'electron'

import Listeners from './listeners'
import { Channel } from '../utils/const'

export enum ResponseCode {
  Fail,
  Success,
}

export default class WalletChannel extends Listeners {
  public win: BrowserWindow

  constructor(window: BrowserWindow) {
    super()
    this.win = window
  }

  public setUILocale = (locale: string) => {
    this.win.webContents.send(Channel.SetLanguage, {
      status: ResponseCode.Success,
      result: locale,
    })
  }

  public navTo = (route: string) => {
    this.win.webContents.send(Channel.NavTo, {
      status: ResponseCode.Success,
      result: {
        router: route,
      },
    })
  }
}
