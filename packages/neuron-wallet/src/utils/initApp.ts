import NetworksController from '../controllers/networks'
import WalletChannel from '../channel/wallet'
import initConnection from '../typeorm'
import env from '../env'

const initApp = () => {
  initConnection().then()
  WalletChannel.start()
  const activeNetworkRes = NetworksController.activeOne()
  if (!activeNetworkRes.status) {
    env.defaultNetworks.forEach((network, idx) => {
      const createdNetworkRes = NetworksController.create(network)
      if (idx === 0 && createdNetworkRes.status) {
        NetworksController.activate(createdNetworkRes.result!.id)
      }
    })
  }
}

export default initApp
