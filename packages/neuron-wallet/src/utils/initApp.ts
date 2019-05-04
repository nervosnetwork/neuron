import { dialog } from 'electron'
import { distinctUntilChanged } from 'rxjs/operators'
import NetworksController, { NetworksMethod } from '../controllers/networks'
import windowManage from './windowManage'
import WalletChannel from '../channel/wallet'
import initConnection from '../typeorm'
import nodeService from '../services/node'
import env from '../env'
import { Channel } from './const'

const initiateNetworks = () => {
  NetworksController.clear()
  env.defaultNetworks.forEach((network, idx) => {
    const createdNetworkRes = NetworksController.create(network)
    if (idx === 0 && createdNetworkRes.status) {
      NetworksController.activate(createdNetworkRes.result!.id)
    }
  })
}

const syncConnectStatus = () => {
  nodeService.tipNumberSubject.pipe(distinctUntilChanged()).subscribe(
    tipNumber => {
      windowManage.broadcast(Channel.Networks, NetworksMethod.Status, {
        status: 1,
        result: typeof tipNumber !== 'undefined',
      })
    },
    () => {},
    () => {
      // TODO: handle complete
    },
  )
}

const initApp = () => {
  nodeService.start()
  // TODO: this function should be moved to somewhere syncing data
  syncConnectStatus()
  // TODO: call this function after get network name
  initConnection('testnet').then()
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
