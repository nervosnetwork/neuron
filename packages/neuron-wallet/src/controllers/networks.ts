import { ResponseCode, ChannelResponse } from '.'
import NetworksService from '../services/networks'
import { NetworkType, NetworkID, NetworkWithID, Network } from '../store/networksStore'

export enum NetworksMethod {
  GetAll = 'getAll',
  Get = 'get',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Activate = 'activate',
  ActiveOne = 'activeOne',
  Clear = 'clear',
  Status = 'status',
}

class NetworksController {
  static service = new NetworksService()

  public static getAll = (): ChannelResponse<NetworkWithID[]> => {
    return {
      status: ResponseCode.Success,
      result: NetworksController.service.getAll(),
    }
  }

  public static get = (id: NetworkID): ChannelResponse<NetworkWithID> => {
    const network = NetworksController.service.get(id)
    if (network) {
      return {
        status: ResponseCode.Success,
        result: network,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: `Network of id ${id} is not found`,
    }
  }

  public static create = ({ name, remote, type = NetworkType.Normal }: Network): ChannelResponse<NetworkWithID> => {
    if (!name || !remote) {
      return {
        status: ResponseCode.Fail,
        msg: 'Name and remote are required',
      }
    }
    // example for return error
    if (name === 'error') {
      return {
        status: ResponseCode.Fail,
        msg: `Name cannot be "error"`,
      }
    }
    try {
      const created = NetworksController.service.create(name, remote, type)
      return {
        status: ResponseCode.Success,
        result: created,
      }
    } catch (err) {
      return {
        status: ResponseCode.Fail,
        msg: err.message,
      }
    }
  }

  public static update = (id: NetworkID, options: Partial<Network>): ChannelResponse<boolean> => {
    try {
      NetworksController.service.update(id, options)
      return {
        status: ResponseCode.Success,
        result: true,
      }
    } catch (err) {
      return {
        status: ResponseCode.Fail,
        msg: err.message,
      }
    }
  }

  public static delete = (id: NetworkID): ChannelResponse<boolean> => {
    // regard the network of id 1 as the default one, which is not allowed to be deleted
    const defaultNetwork = NetworksController.service.defaultOne()
    if (defaultNetwork && defaultNetwork.id === id) {
      return {
        status: ResponseCode.Fail,
        msg: 'Default network is unremovable',
      }
    }
    try {
      const activeNetwork = NetworksController.service.activeOne()
      if (activeNetwork && activeNetwork.id === id) {
        if (!defaultNetwork) {
          return {
            status: ResponseCode.Fail,
            msg: 'Default network is not set, cannot delete active network',
          }
        }
        NetworksController.service.delete(id)
        NetworksController.activate(defaultNetwork.id)
      }
      NetworksController.service.delete(id)
      return {
        status: ResponseCode.Success,
        result: true,
      }
    } catch (err) {
      return {
        status: ResponseCode.Fail,
        msg: err.message,
      }
    }
  }

  public static activeOne = () => {
    const activeOne = NetworksController.service.activeOne()
    if (activeOne) {
      return {
        status: ResponseCode.Success,
        result: activeOne,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Active network is not set',
    }
  }

  public static activate = (id: NetworkID) => {
    try {
      NetworksController.service.activate(id)
    } catch (err) {
      return {
        status: ResponseCode.Fail,
        msg: err.message,
      }
    }
    return NetworksController.activeOne()
  }

  public static status = () => {
    return false
  }

  public static clear = () => {
    return NetworksController.service.clear()
  }
}

export default NetworksController
