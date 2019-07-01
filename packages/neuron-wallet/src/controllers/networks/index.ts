import NetworksService, { NetworkType, NetworkID, Network } from '../../services/networks'
import { CatchControllerError, Controller as ControllerDecorator } from '../../decorators'
import { Channel, ResponseCode } from '../../utils/const'
import {
  IsRequired,
  InvalidName,
  NetworkNotFound,
  DefaultNetworkUnremovable,
  LackOfDefaultNetwork,
  ActiveNetworkNotSet,
} from '../../exceptions'

const networksService = NetworksService.getInstance()

/**
 * @class NetworksController
 * @description handle messages from networks channel
 */
@ControllerDecorator(Channel.Networks)
export default class NetworksController {
  @CatchControllerError
  public static async getAll() {
    const networks = await networksService.getAll()
    return {
      status: ResponseCode.Success,
      result: networks,
    }
  }

  @CatchControllerError
  public static async get(id: NetworkID) {
    if (typeof id === 'undefined') throw new IsRequired('ID')

    const network = await networksService.get(id)
    if (!network) throw new NetworkNotFound(id)

    return {
      status: ResponseCode.Success,
      result: network,
    }
  }

  @CatchControllerError
  public static async create({ name, remote, type = NetworkType.Normal }: Network) {
    if (!name || !remote) throw new IsRequired('Name and address')
    if (name === 'error') throw new InvalidName('Network')

    const created = await networksService.create(name, remote, type)
    return {
      status: ResponseCode.Success,
      result: created,
    }
  }

  @CatchControllerError
  public static async update(id: NetworkID, options: Partial<Network>) {
    if (options.name && options.name === 'error') throw new InvalidName('Network')

    await networksService.update(id, options)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  @CatchControllerError
  public static async delete(id: NetworkID) {
    const defaultNetwork = await networksService.defaultOne()

    if (defaultNetwork && defaultNetwork.id === id) throw new DefaultNetworkUnremovable()

    const activeId = await networksService.activeId()
    if (activeId === id) {
      if (!defaultNetwork) throw new LackOfDefaultNetwork()
      await networksService.delete(id)
      await NetworksController.activate(defaultNetwork.id)
    }
    await networksService.delete(id)

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  @CatchControllerError
  public static async activeId() {
    const activeId = await networksService.activeId()
    if (activeId) {
      return {
        status: ResponseCode.Success,
        result: activeId,
      }
    }
    throw new ActiveNetworkNotSet()
  }

  @CatchControllerError
  public static async activate(id: NetworkID) {
    await networksService.activate(id)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  @CatchControllerError
  public static async clear() {
    await networksService.clear()
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }
}

/* eslint-disable */
declare global {
  module Controller {
    type NetworksMethod = Exclude<keyof typeof NetworksController, keyof typeof Object | 'service'>
  }
}
/* eslint-enable */
