import { app, BrowserWindow } from 'electron'
import WalletsController from '../controllers/wallets'
import NetworksController from '../controllers/networks'
import { Channel } from '../utils/const'
import { ResponseCode } from '../controllers'

const initWindow = async (win: BrowserWindow) => {
  const wallet = WalletsController.getActive() as any
  const wallets = WalletsController.getAll() as any
  const initState = {
    activeWallet: wallet.status ? wallet.result : null,
    wallets: wallets.status ? wallets.result : [],
    activeNetworkId: await NetworksController.service.activeId(),
    networks: await NetworksController.service.getAll(),
    locale: app.getLocale(),
  }
  win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
}

export default initWindow
