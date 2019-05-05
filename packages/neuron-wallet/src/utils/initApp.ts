import { distinctUntilChanged } from 'rxjs/operators'
import NetworksController, { NetworksMethod } from '../controllers/networks'
import windowManage from './windowManage'
import WalletChannel from '../channel/wallet'
import initConnection from '../typeorm'
import nodeService from '../services/node'
import { Channel } from './const'

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
  nodeService.start()
  // TODO: this function should be moved to somewhere syncing data
  syncConnectStatus()
  initConnection().then()
  WalletChannel.start()
  const activeId = await NetworksController.service.activeId()
  if (!activeId) {
    await NetworksController.service.init()
  }
}

export default initApp
