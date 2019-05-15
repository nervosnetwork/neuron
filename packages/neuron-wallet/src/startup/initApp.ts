import { distinctUntilChanged } from 'rxjs/operators'
import NetworksController, { NetworksMethod } from '../controllers/networks'
import windowManage from '../utils/windowManage'
import WalletChannel from '../channel/wallet'
import nodeService from './nodeService'
import { Channel } from '../utils/const'

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

const initApp = async () => {
  // TODO: this function should be moved to somewhere syncing data
  syncConnectStatus()
  WalletChannel.start()
  if (!nodeService.core.node.url) {
    const id = await NetworksController.service.activeId()
    const network = await NetworksController.service.get(id || '')
    if (network) {
      nodeService.setNetwork(network.remote)
    } else {
      throw new Error('Network not set')
    }
  }

  nodeService.start()
}

export default initApp
