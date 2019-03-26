import { Channel } from '../utils/const'
import { ResponseCode, Response } from '.'
import NetowrkService, { Network } from '../services/networks'
import WalletChannel from '../channel/wallet'
import windowManage from '../main'

class NetworksController {
  public channel: WalletChannel

  static service = new NetowrkService()

  constructor(channel: WalletChannel) {
    this.channel = channel
    NetworksController.service = new NetowrkService()
  }

  public static index = (): Response<Network[]> => {
    const networks = NetworksController.service.index()
    if (networks) {
      return {
        status: ResponseCode.Success,
        result: networks,
      }
    }

    return {
      status: ResponseCode.Fail,
      msg: 'networks not found',
    }
  }

  public static show = (id: string): Response<Network> => {
    const network = NetworksController.service.show(id)
    if (network) {
      return {
        status: ResponseCode.Success,
        result: network,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Network found found',
    }
  }

  public static create = (network: Partial<Network>): Response<Network> => {
    // TODO: validation
    if (network.name && network.remote) {
      const newNetwork = NetworksController.service.create(network.name, network.remote)
      // TODO: sync
      windowManage.broad(Channel.Networks, 'index', NetworksController.index())
      return {
        status: ResponseCode.Success,
        result: newNetwork,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Invalid network',
    }
  }

  public static update = (network: Network): Response<boolean> => {
    // TODO: verification
    const success = NetworksController.service.update(network)
    if (success) {
      // TODO: sync
      windowManage.broad(Channel.Networks, 'index', NetworksController.index())
      return {
        status: ResponseCode.Success,
        result: true,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Network not found',
    }
  }

  public static delete = (id: string): Response<boolean> => {
    // regard the first network as the default one, which is not allowed to be deleted
    const defaultNetwork = NetworksController.service.index()[0]
    const activeNetwork = NetworksController.service.active
    if (id === defaultNetwork.id) {
      return {
        status: ResponseCode.Fail,
        msg: 'Default network is unremovable',
      }
    }
    const success = NetworksController.service.delete(id)
    if (success) {
      // check if deleted network is current network, switch to default network if true
      if (activeNetwork && activeNetwork.id === id) {
        NetworksController.service.setActive(defaultNetwork.id)
        windowManage.broad(Channel.Networks, 'activeNetwork', NetworksController.activeNetwork())
      }
      // TODO: sync
      windowManage.broad(Channel.Networks, 'index', NetworksController.index())
      return {
        status: ResponseCode.Success,
        result: true,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Network not found',
    }
  }

  public static activeNetwork = () => ({
    status: ResponseCode.Success,
    result: NetworksController.service.active,
  })

  public static setActive = (id: string): Response<Network> => {
    const success = NetworksController.service.setActive(id)

    if (success) {
      return {
        status: ResponseCode.Success,
        result: NetworksController.service.active,
      }
    }

    return {
      status: ResponseCode.Fail,
      msg: 'Network not found',
    }
  }

  public static status = () => {
    return false
  }
}

export default NetworksController
