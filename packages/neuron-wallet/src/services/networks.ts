import { v4 as uuid } from 'uuid'
import { BehaviorSubject } from 'rxjs'

import Store from '../utils/store'
import env from '../env'

import windowManage from '../utils/windowManage'
import { NetworksMethod } from '../controllers/networks'
import { Channel, ResponseCode } from '../utils/const'
import nodeService from '../startup/nodeService'

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

export const networkSwitchSubject = new BehaviorSubject<undefined | NetworkWithID>(undefined)

export default class NetworksService extends Store {
  constructor() {
    super('networks', 'index.json', JSON.stringify(env.presetNetworks))
    this.on(NetworksKey.List, async (_, newValue: NetworkWithID[]) => {
      windowManage.broadcast(Channel.Networks, NetworksMethod.GetAll, {
        status: ResponseCode.Success,
        result: newValue,
      })
      const network = await this.activeId()
      if (network) {
        windowManage.broadcast(Channel.Networks, NetworksMethod.ActiveId, {
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

    this.on(NetworksKey.Active, async (_, newActiveId) => {
      const network = await this.get(newActiveId)
      if (network) {
        nodeService.setNetwork(network.remote)
        networkSwitchSubject.next(network)
      }
      windowManage.broadcast(Channel.Networks, NetworksMethod.ActiveId, {
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

  public get = async (id: NetworkID) => {
    const list = await this.getAll()
    return list.find(item => item.id === id)
  }

  public updateAll = async (networks: NetworkWithID[]) => {
    await this.writeSync(NetworksKey.List, networks)
    return true
  }

  public create = async (name: NetworkName, remote: NetworkRemote, type: NetworkType = NetworkType.Normal) => {
    const list = await this.getAll()
    if (list.some(item => item.name === name)) {
      throw new Error('Network name exists')
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

  public update = async (id: NetworkID, options: Partial<Network>) => {
    const list = await this.getAll()
    const network = list.find(item => item.id === id)
    if (!network) {
      throw new Error(`Network with id ${id} is not found`)
    }
    Object.assign(network, options)
    this.updateAll(list)
    const activeId = await this.activeId()
    if (activeId === id) {
      await this.activate(id)
    }
    return true
  }

  public delete = async (id: NetworkID) => {
    const list = await this.getAll()
    this.updateAll(list.filter(item => item.id !== id))
    return true
  }

  public activate = async (id: NetworkID) => {
    const network = await this.get(id)
    if (!network) {
      throw new Error(`Network of ${id} is not found`)
    }
    this.writeSync(NetworksKey.Active, id)
  }

  public activeId = async () => {
    return this.read<string>(NetworksKey.Active)
  }

  public defaultOne = async () => {
    const list = await this.getAll()
    return list.find(item => item.type === NetworkType.Default)
  }

  public clear = async () => {
    await this.clear()
    return true
  }
}
