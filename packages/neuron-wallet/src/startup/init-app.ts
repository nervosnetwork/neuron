import Router from '../router'
import NodeService from '../services/node'
import NetworksService from '../services/networks'
import app from '../app'
import { ActiveNetowrkNotSet } from '../exceptions'

const nodeService = NodeService.getInstance()
const networksService = NetworksService.getInstance()

const initApp = async () => {
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
