import { NetworkType, NetworkID, Network } from 'types/network'
import NetworksService from 'services/networks'
import { ResponseCode } from 'utils/const'
import { IsRequired, InvalidName, NetworkNotFound, CurrentNetworkNotSet } from 'exceptions'

const networksService = NetworksService.getInstance()

export default class NetworksController {
  public static async getAll() {
    const networks = await networksService.getAll()
    return {
      status: ResponseCode.Success,
      result: networks,
    }
  }

  public static async get(id: NetworkID) {
    if (typeof id === 'undefined') {
      throw new IsRequired('ID')
    }

    const network = await networksService.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }

    return {
      status: ResponseCode.Success,
      result: network,
    }
  }

  public static async create({ name, remote, type = NetworkType.Normal }: Network) {
    if (!name || !remote) {
      throw new IsRequired('Name and address')
    }
    if (name === 'error') {
      throw new InvalidName('Network')
    }

    const created = await networksService.create(name, remote, type)
    return {
      status: ResponseCode.Success,
      result: created,
    }
  }

  public static async update(id: NetworkID, options: Partial<Network>) {
    if (options.name && options.name === 'error') {
      throw new InvalidName('Network')
    }

    await networksService.update(id, options)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  public static async delete(id: NetworkID) {
    await networksService.delete(id)

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  public static async currentID() {
    const currentID = await networksService.getCurrentID()
    if (currentID) {
      return {
        status: ResponseCode.Success,
        result: currentID,
      }
    }
    throw new CurrentNetworkNotSet()
  }

  public static async activate(id: NetworkID) {
    await networksService.activate(id)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  public static async clear() {
    await networksService.clear()
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }
}
