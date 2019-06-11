import NetworksService, { NetworkType, NetworkID, Network } from '../../services/networks'
import { CatchControllerError, Controller as ControllerDecorator } from '../../decorators'
import { Channel, ResponseCode } from '../../utils/const'
import i18n from '../../utils/i18n'

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
    if (typeof id === 'undefined') throw new Error(i18n.t('messages.id-is-required'))

    const network = await networksService.get(id)
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

    const created = await networksService.create(name, remote, type)
    return {
      status: ResponseCode.Success,
      result: created,
    }
  }

  @CatchControllerError
  public static async update(id: NetworkID, options: Partial<Network>) {
    if (options.name && options.name === 'error') throw new Error(i18n.t('messages.invalid-name'))

    await networksService.update(id, options)
    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  @CatchControllerError
  public static async delete(id: NetworkID) {
    const defaultNetwork = await networksService.defaultOne()

    if (defaultNetwork && defaultNetwork.id === id) throw new Error(i18n.t('messages.default-network-is-unremovable'))

    const activeId = await networksService.activeId()
    if (activeId === id) {
      if (!defaultNetwork) throw new Error('messages.cannot-delete-active-network-due-to-lack-of-default-one')
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
    throw new Error(i18n.t('messages.active-network-is-not-set'))
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
