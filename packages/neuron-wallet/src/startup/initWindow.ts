import { app, BrowserWindow } from 'electron'
import controllers from '../controllers'
import { Channel, ResponseCode } from '../utils/const'

const { WalletsController, NetworksController } = controllers

const initWindow = async (win: BrowserWindow) => {
  const [activeWallet, wallets, activeNetworkId, networks] = await Promise.all([
    WalletsController.service.getCurrent(),
    WalletsController.service.getAll(),
    NetworksController.service.activeId(),
    NetworksController.service.getAll(),
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
    wallets: [...wallets.map(({ name, id }) => ({ id, name }))],
    activeNetworkId,
    networks,
    locale,
  }
  win.webContents.send(Channel.Initiate, { status: ResponseCode.Success, result: initState })
}

export default initWindow
