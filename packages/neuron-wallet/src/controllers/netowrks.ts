import { ResponseCode, ChannelResponse } from '.'
import windowManage from '../main'
import WalletChannel from '../channel/wallet'
import NetowrksService, { Network } from '../services/networks'
import { Channel } from '../utils/const'

export enum NetworksMethod {
  Index = 'index',
  Show = 'show',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Active = 'active',
  SetActive = 'setActive',
}
class NetworksController {
  public channel: WalletChannel

  static service = new NetowrksService()

  constructor(channel: WalletChannel) {
    this.channel = channel
  }

  public static index = (): ChannelResponse<Network[]> => {
    const networks = NetworksController.service.index()
    if (networks) {
      return {
        status: ResponseCode.Success,
        result: networks,
      }
    }

    return {
      status: ResponseCode.Fail,
      msg: 'Networks not found',
    }
  }

  public static show = (id: string): ChannelResponse<Network> => {
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

  public static create = (network: Partial<Network>): ChannelResponse<Network> => {
    // TODO: validation
    if (network.name && network.remote) {
      const newNetwork = NetworksController.service.create(network.name, network.remote)
      // TODO: sync
      windowManage.broadcast(Channel.Networks, NetworksMethod.Index, NetworksController.index())
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

  public static update = (network: Network): ChannelResponse<boolean> => {
    // TODO: verification
    const success = NetworksController.service.update(network)
    if (success) {
      // TODO: sync
      windowManage.broadcast(Channel.Networks, NetworksMethod.Index, NetworksController.index())
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

  public static delete = (id: string): ChannelResponse<boolean> => {
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
        windowManage.broadcast(Channel.Networks, NetworksMethod.Active, NetworksController.active())
      }
      // TODO: sync
      windowManage.broadcast(Channel.Networks, NetworksMethod.Index, NetworksController.index())
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

  public static active = () => ({
    status: ResponseCode.Success,
    result: NetworksController.service.active,
  })

  public static setActive = (id: string): ChannelResponse<Network> => {
    const success = NetworksController.service.setActive(id)
    windowManage.broadcast(Channel.Networks, NetworksMethod.Active, NetworksController.active())

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
