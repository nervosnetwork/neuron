import { v4 } from 'uuid'
import store, {
  NetworkName,
  NetworkRemote,
  NetworkType,
  NetworkID,
  NetworkWithID,
  Network,
  NetworksKey,
} from '../store/networksStore'

import windowManage from '../utils/windowManage'
import { ResponseCode } from '../controllers'
import { NetworksMethod } from '../controllers/networks'
import { Channel } from '../utils/const'

export default class NetworksService {
  public store: typeof store = store

  constructor() {
    store.onDidChange(NetworksKey.List, newValue => {
      windowManage.broadcast(Channel.Networks, NetworksMethod.GetAll, {
        status: ResponseCode.Success,
        result: newValue,
      })
      const network = this.activeOne()
      if (network) {
        windowManage.broadcast(Channel.Networks, NetworksMethod.ActiveOne, {
          status: ResponseCode.Success,
          result: network,
        })
      } else {
        const defaultNetowrk = this.defaultOne()
        if (defaultNetowrk) {
          this.activate(defaultNetowrk.id)
        }
      }
    })

    store.onDidChange(NetworksKey.Active, () => {
      const network = this.activeOne()
      windowManage.broadcast(Channel.Networks, NetworksMethod.ActiveOne, {
        status: ResponseCode.Success,
        result: network,
      })
    })
  }

  public getAll = (): NetworkWithID[] => {
    return this.store.get(NetworksKey.List) || []
  }

  public get = (id: NetworkID) => {
    return this.getAll().find(item => item.id === id)
  }

  public create = (name: NetworkName, remote: NetworkRemote, type: NetworkType = NetworkType.Normal) => {
    const networks = this.getAll()
    if (networks.some(item => item.name === name)) {
      throw new Error('Network name exists')
    }
    const newNetwork = {
      id: v4(),
      name,
      remote,
      type,
    }
    this.updateAll([...networks, newNetwork])
    return newNetwork
  }

  public update = (id: NetworkID, options: Partial<Network>) => {
    const networks = this.getAll()
    const network = networks.find(item => item.id === id)
    if (!network) {
      throw new Error(`Network with id ${id} is not found`)
    }
    Object.assign(network, options)
    this.updateAll(networks)
    const activeOne = this.activeOne()
    if (activeOne && activeOne.id === id) {
      this.activate(id)
    }
    return true
  }

  public updateAll = (networks: NetworkWithID[]) => {
    this.store.set(NetworksKey.List, networks)
    return true
  }

  public delete = (id: NetworkID) => {
    this.updateAll(this.getAll().filter(item => item.id !== id))
    return true
  }

  public activate = (id: NetworkID) => {
    const network = this.get(id)
    if (!network) {
      throw new Error(`Network of ${id} is not found`)
    }
    this.store.set(NetworksKey.Active, id)
  }

  public activeOne = (): NetworkWithID | undefined => {
    const activeId = this.store.get(NetworksKey.Active)
    return this.getAll().find(item => item.id === activeId)
  }

  public defaultOne = (): NetworkWithID | undefined => this.getAll().find(item => item.type === NetworkType.Default)

  public clear = () => this.store.clear()
}
