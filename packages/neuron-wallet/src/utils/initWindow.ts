import { app, BrowserWindow } from 'electron'
import WalletsController from '../controllers/wallets'
import NetworksController from '../controllers/networks'
import { Channel } from './const'
import { ResponseCode } from '../controllers'

const initWindow = (win: BrowserWindow) => {
  const wallet = WalletsController.getActive() as any
  const wallets = WalletsController.getAll() as any
  const initState = {
    activeWallet: wallet.status ? wallet.result : null,
    wallets: wallets.status ? wallets.result : [],
    activeNetwork: NetworksController.activeOne().result,
    networks: NetworksController.getAll().result,
    locale: app.getLocale(),
  }
  win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
}

export default initWindow
