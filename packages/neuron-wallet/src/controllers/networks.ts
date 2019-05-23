import { ResponseCode } from '.'
import NetworksService, { NetworkType, NetworkID, Network } from '../services/networks'
import { CatchControllerError } from '../utils/decorators'
import i18n from '../utils/i18n'

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

/**
 * @class NetworksController
 * @description handle messages from networks channel
 */
class NetworksController {
  static service = new NetworksService()

  /**
   * @method getAll
   * @static
   * @memberof NetworksController
   * @description return all networks if possible
   */

  @CatchControllerError
  public static async getAll() {
    const networks = await NetworksController.service.getAll()
    return {
      status: ResponseCode.Success,
      result: networks,
    }
  }

  /**
   * @method get
   * @static
   * @memberof NetworksController
   * @description get netowrk by id
   */
  @CatchControllerError
  public static async get(id: NetworkID) {
    if (typeof id === 'undefined') throw new Error(i18n.t('messages.id-is-required'))

    const network = await NetworksController.service.get(id)
    if (!network) throw new Error(i18n.t('messages.network-of-id-is-not-found', { id }))

    return {
      status: ResponseCode.Success,
      result: network,
    }
  }

  /**
   *
   * @method create
   * @static
   * @memberof NetworksController
   * @description create network with name, remote address, netowrk type
   */
  @CatchControllerError
  public static async create({ name, remote, type = NetworkType.Normal }: Network) {
    if (!name || !remote) throw new Error(i18n.t('messages.name-and-remote-address-are-required'))
    if (name === 'error') throw new Error(i18n.t('messages.invalid-name'))

    const created = await NetworksController.service.create(name, remote, type)
    return {
      status: ResponseCode.Success,
      result: created,
    }
  }

  /**
   * @method update
   * @static
   * @memberof NetworksController
   * @description update network by id
   */
  @CatchControllerError
  public static async update(id: NetworkID, options: Partial<Network>) {
    if (options.name && options.name === 'error') throw new Error(i18n.t('messages.invalid-name'))

    await NetworksController.service.update(id, options)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  /**
   * @method delete
   * @static
   * @memberof NetworksController
   * @description delete network by id
   */
  @CatchControllerError
  public static async delete(id: NetworkID) {
    const defaultNetwork = await NetworksController.service.defaultOne()

    if (defaultNetwork && defaultNetwork.id === id) throw new Error(i18n.t('messages.default-network-is-unremovable'))

    const activeId = await NetworksController.service.activeId()
    if (activeId === id) {
      if (!defaultNetwork) throw new Error('messages.cannot-delete-active-network-due-to-lack-of-default-one')
      await NetworksController.service.delete(id)
      await NetworksController.activate(defaultNetwork.id)
    }
    await NetworksController.service.delete(id)

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  /**
   * @method activeOne
   * @static
   * @memberof NetworksController
   * @description get the currecnt/active network id
   */
  @CatchControllerError
  public static async activeOne() {
    const activeId = await NetworksController.service.activeId()
    if (activeId) {
      return {
        status: ResponseCode.Success,
        result: activeId,
      }
    }
    throw new Error(i18n.t('messages.active-network-is-not-set'))
  }

  /**
   * @method activate
   * @static
   * @memberof NetworksController
   * @description set the current/active network by id
   */
  @CatchControllerError
  public static async activate(id: NetworkID) {
    await NetworksController.service.activate(id)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  /**
   * @mehtod clear
   * @static
   * @memberof NetworksController
   * @description clear the networks
   */
  @CatchControllerError
  public static async clear() {
    await NetworksController.service.clear()
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }
}

export default NetworksController
