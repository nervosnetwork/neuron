import { dialog } from 'electron'
import NetworksController from '../controllers/networks'
import WalletChannel from '../channel/wallet'
import initConnection from '../typeorm'
import nodeService from '../services/node'
import env from '../env'

const initiateNetworks = () => {
  NetworksController.clear()
  env.defaultNetworks.forEach((network, idx) => {
    const createdNetworkRes = NetworksController.create(network)
    if (idx === 0 && createdNetworkRes.status) {
      NetworksController.activate(createdNetworkRes.result!.id)
    }
  })
}

const initApp = () => {
  nodeService.start()
  initConnection().then()
  WalletChannel.start()
  const { status, result } = NetworksController.activeOne()
  if (!status) {
    initiateNetworks()
  } else if (!result || !result.id || !result.name || !result.remote) {
    dialog.showErrorBox('failed-to-load-networks', 'networks will-be-reset')
    initiateNetworks()
  }
}

export default initApp
