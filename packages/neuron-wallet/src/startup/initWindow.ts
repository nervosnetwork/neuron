import { app, BrowserWindow } from 'electron'
import controllers, { ResponseCode } from '../controllers'
import { Channel } from '../utils/const'

const { WalletsController, NetworksController } = controllers

const initWindow = async (win: BrowserWindow) => {
  const initState = {
    activeWallet: await WalletsController.service.getCurrent(),
    wallets: await WalletsController.service.getAll(),
    activeNetworkId: await NetworksController.service.activeId(),
    networks: await NetworksController.service.getAll(),
    locale: app.getLocale(),
  }
  win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
}

export default initWindow
