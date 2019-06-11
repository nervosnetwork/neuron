import { v4 as uuid } from 'uuid'
import { BehaviorSubject, fromEvent } from 'rxjs'
import { debounceTime } from 'rxjs/operators'

import Store from '../utils/store'
import env from '../env'

import windowManage from '../utils/window-manage'
import { Channel, ResponseCode } from '../utils/const'

import { Validate, Required } from '../decorators'
import NodeService from './node'
import { NameIsUsed, NetworkIsNotFound, InvalidFormat } from '../exceptions'

export type NetworkID = string
export type NetworkName = string
export type NetworkRemote = string
export enum NetworksKey {
  List = 'list',
  Active = 'active',
}
export enum NetworkType {
  Default,
  Normal,
}
export interface Network {
  name: NetworkName
  remote: NetworkRemote
  type: NetworkType
}
export interface NetworkWithID extends Network {
  id: NetworkID
}

const DEBOUNCE_TIME = 50

export const networkSwitchSubject = new BehaviorSubject<undefined | NetworkWithID>(undefined)

export default class NetworksService extends Store {
  private static instance: NetworksService

  public static getInstance = () => {
    if (!NetworksService.instance) {
      NetworksService.instance = new NetworksService()
    }
    return NetworksService.instance
  }

  constructor() {
    super('networks', 'index.json', JSON.stringify(env.presetNetworks))
    fromEvent<[NetworkWithID[], NetworkWithID[]]>(this, NetworksKey.List)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(async ([, newValue]) => {
        windowManage.broadcast(Channel.Networks, 'getAll', {
          status: ResponseCode.Success,
          result: newValue,
        })
        const network = await this.activeId()
        if (network) {
          windowManage.broadcast(Channel.Networks, 'activeId', {
            status: ResponseCode.Success,
            result: network,
          })
        } else {
          const defaultNetwork = await this.defaultOne()
          if (defaultNetwork) {
            this.activate(defaultNetwork.id)
          }
        }
      })

    fromEvent<[string, string]>(this, NetworksKey.Active)
      .pipe(debounceTime(DEBOUNCE_TIME))
      .subscribe(async ([, newActiveId]) => {
        const network = await this.get(newActiveId)
        if (network) {
          NodeService.getInstance().setNetwork(network.remote)
          networkSwitchSubject.next(network)
        }
        windowManage.broadcast(Channel.Networks, 'activeId', {
          status: ResponseCode.Success,
          result: newActiveId,
        })
      })

    this.activeId().then(activeId => {
      if (activeId) {
        this.emit(NetworksKey.Active, null, activeId)
      }
    })
  }

  public getAll = async () => {
    const list = await this.read<NetworkWithID[]>(NetworksKey.List)
    return list || []
  }

  @Validate
  public async get(@Required id: NetworkID) {
    const list = await this.getAll()
    return list.find(item => item.id === id) || null
  }

  @Validate
  public async updateAll(@Required networks: NetworkWithID[]) {
    if (!Array.isArray(networks)) throw new InvalidFormat('Networks')
    await this.writeSync(NetworksKey.List, networks)
  }

  @Validate
  public async create(
    @Required name: NetworkName,
    @Required remote: NetworkRemote,
    type: NetworkType = NetworkType.Normal,
  ) {
    const list = await this.getAll()
    if (list.some(item => item.name === name)) {
      throw new NameIsUsed('Network')
    }
    const newOne = {
      id: uuid(),
      name,
      remote,
      type,
    }
    await this.updateAll([...list, newOne])
    return newOne
  }

  @Validate
  public async update(@Required id: NetworkID, @Required options: Partial<Network>) {
    const list = await this.getAll()
    const network = list.find(item => item.id === id)
    if (!network) {
      throw new NetworkIsNotFound(id)
    }
    Object.assign(network, options)
    this.updateAll(list)
    const activeId = await this.activeId()
    if (activeId === id) {
      await this.activate(id)
    }
  }

  @Validate
  public async delete(@Required id: NetworkID) {
    const list = await this.getAll()
    this.updateAll(list.filter(item => item.id !== id))
  }

  @Validate
  public async activate(@Required id: NetworkID) {
    const network = await this.get(id)
    if (!network) {
      throw new NetworkIsNotFound(id)
    }
    this.writeSync(NetworksKey.Active, id)
  }

  public activeId = async () => {
    return (await this.read<string>(NetworksKey.Active)) || null
  }

  public defaultOne = async () => {
    const list = await this.getAll()
    return list.find(item => item.type === NetworkType.Default) || null
  }
}
