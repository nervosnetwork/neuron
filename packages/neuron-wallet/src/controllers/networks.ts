import { ResponseCode } from '.'
import NetworksService, { NetworkType, NetworkID, Network } from '../services/networks'

export enum NetworksMethod {
  GetAll = 'getAll',
  Get = 'get',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Activate = 'activate',
  ActiveId = 'activeId',
  Clear = 'clear',
  Status = 'status',
}

class NetworksController {
  static service = new NetworksService()

  public static getAll = async () => {
    return {
      status: ResponseCode.Success,
      result: await NetworksController.service.getAll(),
    }
  }

  public static get = async (id: NetworkID) => {
    const network = await NetworksController.service.get(id)
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

  public static create = async ({ name, remote, type = NetworkType.Normal }: Network) => {
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
      const created = await NetworksController.service.create(name, remote, type)
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

  public static update = async (id: NetworkID, options: Partial<Network>) => {
    try {
      await NetworksController.service.update(id, options)
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

  public static delete = async (id: NetworkID) => {
    const defaultNetwork = await NetworksController.service.defaultOne()
    if (defaultNetwork && defaultNetwork.id === id) {
      return {
        status: ResponseCode.Fail,
        msg: 'Default network is unremovable',
      }
    }
    try {
      const activeId = await NetworksController.service.activeId()
      if (activeId === id) {
        if (!defaultNetwork) {
          return {
            status: ResponseCode.Fail,
            msg: 'Default network is not set, cannot delete active network',
          }
        }
        await NetworksController.service.delete(id)
        await NetworksController.activate(defaultNetwork.id)
      }
      await NetworksController.service.delete(id)
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

  public static activeOne = async () => {
    const activeId = await NetworksController.service.activeId()
    if (activeId) {
      return {
        status: ResponseCode.Success,
        result: activeId,
      }
    }
    return {
      status: ResponseCode.Fail,
      msg: 'Active network is not set',
    }
  }

  public static activate = async (id: NetworkID) => {
    try {
      await NetworksController.service.activate(id)
    } catch (err) {
      return {
        status: ResponseCode.Fail,
        msg: err.message,
      }
    }
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  public static clear = async () => {
    await NetworksController.service.clear()
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }
}

export default NetworksController
