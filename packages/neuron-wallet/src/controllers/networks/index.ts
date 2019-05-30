import NetworksService, { NetworkType, NetworkID, Network } from '../../services/networks'
import { CatchControllerError } from '../../decorators'
import { ResponseCode } from '../../utils/const'
import i18n from '../../utils/i18n'

/**
 * @class NetworksController
 * @description handle messages from networks channel
 */
export default class NetworksController {
  static service = new NetworksService()

  @CatchControllerError
  public static async getAll() {
    const networks = await NetworksController.service.getAll()
    return {
      status: ResponseCode.Success,
      result: networks,
    }
  }

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

  @CatchControllerError
  public static async update(id: NetworkID, options: Partial<Network>) {
    if (options.name && options.name === 'error') throw new Error(i18n.t('messages.invalid-name'))

    await NetworksController.service.update(id, options)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

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

  @CatchControllerError
  public static async activeId() {
    const activeId = await NetworksController.service.activeId()
    if (activeId) {
      return {
        status: ResponseCode.Success,
        result: activeId,
      }
    }
    throw new Error(i18n.t('messages.active-network-is-not-set'))
  }

  @CatchControllerError
  public static async activate(id: NetworkID) {
    await NetworksController.service.activate(id)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  @CatchControllerError
  public static async clear() {
    await NetworksController.service.clear()
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
