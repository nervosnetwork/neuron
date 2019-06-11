import { app, dialog, shell, Menu, MessageBoxOptions, BrowserWindow } from 'electron'
import { Channel, ResponseCode } from '../../utils/const'
import windowManage from '../../utils/window-manage'
import { URL, contextMenuTemplate } from './options'
import NetworksService from '../../services/networks'
import WalletsService from '../../services/wallets'
import { Controller as ControllerDecorator } from '../../decorators'

@ControllerDecorator(Channel.App)
export default class AppController {
  public static initWindow = async (win: BrowserWindow) => {
    const walletsService = WalletsService.getInstance()
    const networksService = NetworksService.getInstance()
    const [activeWallet, wallets, activeNetworkId, networks] = await Promise.all([
      walletsService.getCurrent(),
      walletsService.getAll(),
      networksService.activeId(),
      networksService.getAll(),
    ])

    const locale = app.getLocale()
    const initState = {
      activeWallet: activeWallet && {
        ...activeWallet,
        addresses: {
          receiving: activeWallet.addresses.receiving.map(addr => addr.address),
          change: activeWallet.addresses.change.map(addr => addr.address),
        },
      },
      balance: '1000000000000001212121212', // TODO: provide the balance of current wallet
      wallets: [...wallets.map(({ name, id }) => ({ id, name }))],
      activeNetworkId,
      networks,
      locale,
    }
    win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
  }

  public static showMessageBox(
    options: MessageBoxOptions,
    callback: (response: number, checkboxChecked: boolean) => void = () => {},
  ) {
    dialog.showMessageBox(options, callback)
  }

  public static navTo(path: string) {
    windowManage.sendToFocusedWindow(Channel.App, 'navTo', {
      status: ResponseCode.Success,
      result: path,
    })
  }

  public static setUILocale(locale: string) {
    windowManage.broadcast(Channel.App, 'setUILocale', {
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
}

/* eslint-disable */
declare global {
  module Controller {
    type AppMethod = Exclude<keyof typeof AppController, keyof typeof Object>
  }
}
/* eslint-enable */
