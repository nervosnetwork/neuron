import EventEmitter from 'events'
import PerunRequestSubject from '../models/subjects/perun'
import PerunService from '../services/perun/service'
import logger from '../utils/logger'
import { ResponseCode } from '../utils/const'
import { SimpleChannelServiceClient } from '@ckb-connect/perun-wallet-wrapper/dist/services'
import {
  AddressEncoder,
  channelIdFromString,
  channelIdToString,
} from '@ckb-connect/perun-wallet-wrapper/dist/translator'
import { mkSimpleChannelServiceClient } from '@ckb-connect/perun-wallet-wrapper/dist/client'
import { bytes } from '@ckb-lumos/codec'
import { Allocation, Balances } from '@ckb-connect/perun-wallet-wrapper/dist/wire'

const defaultAddressEncoder: AddressEncoder = (add: Uint8Array | string) => {
  if (typeof add === 'string') {
    return bytes.bytify(add)
  }
  return add
}

export default class PerunController {
  static emiter = new EventEmitter()
  private static instance: PerunController
  private static serviceClient: SimpleChannelServiceClient

  public static getInstance() {
    logger.info('PerunController: getInstance-----PerunController-----')
    if (!PerunController.instance) {
      PerunController.instance = new PerunController()
      PerunController.serviceClient = PerunController.mkClient()
    }
    logger.info(
      'PerunController: getInstance-----PerunController.instance-----',
      JSON.stringify(PerunController.instance)
    )
    logger.info(
      'PerunController: getInstance-----PerunController.serviceClient-----',
      JSON.stringify(PerunController.serviceClient)
    )
    return PerunController.instance
  }

  // Create a new client for each call, in case the connection break for some reason.
  private static mkClient(): SimpleChannelServiceClient {
    logger.info('PerunController: mkClient-----SimpleChannelServiceClient--')
    // 实际上是创建了一个 gRPC的 client，就是 ChannelServiceClient ，对应的服务器地址是
    const rpcEndpoint = 'http://localhost:4322'
    return mkSimpleChannelServiceClient(defaultAddressEncoder, rpcEndpoint)
  }

  public async start() {
    logger.info('PerunController: start-----PerunService-----')
    return PerunService.getInstance().start()
  }

  public mount() {
    logger.info('PerunController: mount-----PerunController-----')
    this.registerHandlers()
  }

  private registerHandlers = () => {
    logger.info('PerunController: registerHandlers-----PerunController-----')
    PerunController.emiter.on('perun-request', req => {
      logger.info('PerunController: received perun request', req)
      PerunRequestSubject.next(req)
    })
  }

  public respondPerunRequest(params: Controller.Params.RespondPerunRequestParams): Promise<Controller.Response> {
    logger.info('PerunController: respondPerunRequest-----PerunController-----')
    if (!PerunController.emiter.emit('perun-response', params)) {
      return Promise.reject(new Error('Failed to send perun response, no listener registered'))
    }
    return Promise.resolve({
      status: ResponseCode.Success,
    })
  }

  // 去 请求 ChannelService Server 的
  public perunServiceAction(params: Controller.Params.PerunServiceActionParams): Promise<Controller.Response> {
    logger.info('PerunController: perunServiceAction-----PerunController-----', params.type)
    switch (params.type) {
      case 'open':
        return this.openChannel(params.payload as Controller.Params.OpenChannelParams)
      case 'update':
        return this.updateChannel(params.payload as Controller.Params.UpdateChannelParams)
      case 'close':
        return this.closeChannel(params.payload as Controller.Params.CloseChannelParams)
      case 'get':
        return this.getChannels(params.payload as Controller.Params.GetChannelsParams)
      default:
        return Promise.reject(new Error('Invalid perun service action type'))
    }
  }

  async openChannel(params: Controller.Params.OpenChannelParams): Promise<Controller.Response> {
    logger.info('PerunController: openChannel----------', params)
    const alloc = Allocation.create({
      assets: [new Uint8Array(1)],
      balances: Balances.create({
        balances: [
          {
            balance: params.balances,
          },
        ],
      }),
    })
    const res = await PerunController.serviceClient
      .openChannel(params.me, params.peer, alloc, params.challengeDuration)
      .catch(e => {
        logger.info('PerunController: openChannel-----error-----', e)
        return {
          rejected: {
            reason: e.message,
          },
          channelId: undefined,
        }
      })
    if (res.rejected) {
      return {
        status: ResponseCode.Fail,
        message: res.rejected.reason,
      }
    }
    const channelId = channelIdToString(new Uint8Array(res.channelId!))
    logger.log('Controler Buffer channelId', res.channelId!)
    logger.log('Controler channelID', channelId)
    return {
      status: ResponseCode.Success,
      result: {
        channelId: channelId,
        alloc: alloc,
      },
    }
  }

  async updateChannel(params: Controller.Params.UpdateChannelParams): Promise<Controller.Response> {
    const res = await PerunController.serviceClient
      .updateChannel(channelIdFromString(params.channelId), params.index, params.amount)
      .catch(e => {
        return {
          rejected: {
            reason: e.message,
          },
          update: undefined,
        }
      })

    if (res.rejected) {
      return {
        status: ResponseCode.Fail,
        message: res.rejected.reason,
      }
    }

    const state = res.update!.state!

    return {
      status: ResponseCode.Success,
      result: {
        state: state,
      },
    }
  }

  async closeChannel(params: Controller.Params.CloseChannelParams): Promise<Controller.Response> {
    const res = await PerunController.serviceClient.closeChannel(params.channelId)

    if (res.rejected) {
      return {
        status: ResponseCode.Fail,
        message: res.rejected.reason,
      }
    }

    return {
      status: ResponseCode.Success,
      result: {
        channelId: res.close!.channelId!,
      },
    }
  }

  async getChannels(params: Controller.Params.GetChannelsParams): Promise<Controller.Response> {
    logger.info('PerunController: getChannels----------')
    const res = await PerunController.serviceClient.getChannels(params.requester)

    if (res.rejected) {
      return {
        status: ResponseCode.Fail,
        message: res.rejected.reason,
      }
    }

    return {
      status: ResponseCode.Success,
      result: {
        channels: res.channelStates,
      },
    }
  }
}
