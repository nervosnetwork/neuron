import { distinctUntilChanged } from 'rxjs/operators'
import windowManage from '../utils/window-manage'
import Router from '../router'
import NodeService from '../services/node'
import NetworksService from '../services/networks'
import { Channel } from '../utils/const'
import logger from '../utils/logger'
import app from '../app'
import { ActiveNetowrkNotSet } from '../exceptions'

const nodeService = NodeService.getInstance()
const networksService = NetworksService.getInstance()

const syncConnectStatus = () => {
  nodeService.tipNumberSubject.pipe(distinctUntilChanged()).subscribe(
    tipNumber => {
      windowManage.broadcast(Channel.Networks, 'status', {
        status: 1,
        result: typeof tipNumber !== 'undefined',
      })
    },
    err => {
      logger.log({ level: 'error', message: err.message })
      syncConnectStatus()
    },
  )
}

const initApp = async () => {
  // TODO: this function should be moved to somewhere syncing data
  syncConnectStatus()
  if (!nodeService.core.node.url) {
    const id = await networksService.activeId()
    const network = await networksService.get(id || '')
    if (network) {
      nodeService.setNetwork(network.remote)
    } else {
      throw new ActiveNetowrkNotSet()
    }
  }
  const router = new Router()
  Object.defineProperty(app, 'router', {
    value: router,
  })

  nodeService.start()
}

export default initApp
