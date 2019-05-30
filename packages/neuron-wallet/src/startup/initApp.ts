import { distinctUntilChanged } from 'rxjs/operators'
import controllers from '../controllers'
import windowManage from '../utils/windowManage'
import Router from '../router'
import nodeService from './nodeService'
import { Channel } from '../utils/const'
import logger from '../utils/logger'
import app from '../app'

const { NetworksController } = controllers

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
    const id = await NetworksController.service.activeId()
    const network = await NetworksController.service.get(id || '')
    if (network) {
      nodeService.setNetwork(network.remote)
    } else {
      throw new Error('Network not set')
    }
  }
  const router = new Router()
  Object.defineProperty(app, 'router', {
    value: router,
  })

  nodeService.start()
}

export default initApp
