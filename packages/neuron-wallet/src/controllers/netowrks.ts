import { ResponseCode, ChannelResponse } from '.'
import windowManage from '../main'
import WalletChannel from '../channel/wallet'
import NetowrksService, { Network } from '../services/networks'
import { Channel } from '../utils/const'

const DEFAULT_NETWORK_ID = 1

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
    // use typeorm hooks in the future
    // NetworksController.index().then(res => {
    //   windowManage.broadcast(Channel.Networks, NetworksMethod.Index, res)
    // })
  }

  public static index = (): Promise<ChannelResponse<Network[]>> =>
    NetworksController.service
      .index()
      .then(networks => ({
        status: ResponseCode.Success,
        result: networks,
      }))
      .catch(err => ({
        status: ResponseCode.Fail,
        msg: err.message,
      }))

  public static show = (id: number): Promise<ChannelResponse<Network>> =>
    NetworksController.service
      .show(id)
      .then(network => ({ status: ResponseCode.Success, result: network }))
      .catch(err => ({ status: ResponseCode.Fail, msg: err.message }))

  public static create = async ({ name, remote }: Partial<Network>): Promise<ChannelResponse<Network>> => {
    if (name && remote) {
      return NetworksController.service
        .create(name, remote)
        .then(savedNetwork => {
          NetworksController.index().then(res => {
            // use typeorm hooks in the future
            windowManage.broadcast(Channel.Networks, NetworksMethod.Index, res)
          })
          return {
            status: ResponseCode.Success,
            result: savedNetwork,
          }
        })
        .catch(err => ({
          status: ResponseCode.Fail,
          msg: err.message,
        }))
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Invalid network',
    }
  }

  public static update = async (network: Partial<Network>): Promise<ChannelResponse<boolean>> =>
    NetworksController.service
      .update(network)
      .then(success => {
        if (success) {
          NetworksController.index().then(res => windowManage.broadcast(Channel.Networks, NetworksMethod.Index, res))
          return {
            status: ResponseCode.Success,
            result: true,
          }
        }
        return {
          status: ResponseCode.Fail,
          msg: 'Unable to update network',
        }
      })
      .catch(err => ({ status: ResponseCode.Fail, msg: err.message }))

  public static delete = async (id: number): Promise<ChannelResponse<boolean>> => {
    // regard the network of id 1 as the default one, which is not allowed to be deleted
    if (id === DEFAULT_NETWORK_ID) {
      return {
        status: ResponseCode.Fail,
        msg: 'Default network is unremovable',
      }
    }
    const activeNetwork = NetworksController.service.active
    const success = await NetworksController.service.delete(id)
    if (success) {
      // check if deleted network is current network, switch to default network if true
      if (activeNetwork && activeNetwork.id === id) {
        await NetworksController.service.setActive(DEFAULT_NETWORK_ID)
        windowManage.broadcast(Channel.Networks, NetworksMethod.Active, NetworksController.active())
      }
      windowManage.broadcast(Channel.Networks, NetworksMethod.Index, await NetworksController.index())
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

  public static setActive = (id: number): Promise<ChannelResponse<Network>> =>
    NetworksController.service
      .setActive(id)
      .then(success => {
        if (success) {
          return {
            status: ResponseCode.Success,
            result: NetworksController.service.active,
          }
        }
        return {
          status: ResponseCode.Fail,
          msg: 'Unable to set network active',
        }
      })
      .catch(err => ({ status: ResponseCode.Fail, msg: err.message }))

  public static status = () => {
    return false
  }
}

export default NetworksController
