import Core from '@nervosnetwork/ckb-sdk-core'
import { v4 as uuid } from 'uuid'
import { BehaviorSubject } from 'rxjs'
import { LackOfDefaultNetwork, DefaultNetworkUnremovable } from 'exceptions/network'

import Store from 'models/store'
import env from 'env'

import { Validate, Required } from 'decorators'
import { UsedName, NetworkNotFound, InvalidFormat } from 'exceptions'
import { NetworkListSubject, CurrentNetworkIDSubject } from 'models/subjects/networks'
import { NetworkID, NetworkName, NetworkRemote, NetworksKey, NetworkType, Network, NetworkWithID } from 'types/network'

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

    this.getAll().then(currentNetworkList => {
      if (currentNetworkList) {
        NetworkListSubject.next({
          currentNetworkList,
        })
      }
    })

    this.getCurrentID().then(currentNetworkID => {
      if (currentNetworkID) {
        CurrentNetworkIDSubject.next({ currentNetworkID })
        this.get(currentNetworkID).then(network => {
          if (network) {
            networkSwitchSubject.next(network)
          }
        })
      }
    })

    this.on(NetworksKey.List, async (_, currentNetworkList: NetworkWithID[] = []) => {
      NetworkListSubject.next({ currentNetworkList })

      const currentID = await this.getCurrentID()
      if (currentNetworkList.find(network => network.id === currentID)) {
        return
      }

      const defaultNetwork = await this.defaultOne()
      if (!defaultNetwork) {
        throw new LackOfDefaultNetwork()
      }
      this.activate(defaultNetwork.id)
    })

    this.on(NetworksKey.Current, async (_, currentNetworkID: NetworkID) => {
      const currentNetwork = await this.get(currentNetworkID)
      if (!currentNetwork) {
        throw new NetworkNotFound(currentNetworkID)
      }
      CurrentNetworkIDSubject.next({ currentNetworkID })
      networkSwitchSubject.next(currentNetwork)
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
    if (!Array.isArray(networks)) {
      throw new InvalidFormat('Networks')
    }
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
      throw new UsedName('Network')
    }

    const core = new Core(remote)

    const chain = await core.rpc
      .getBlockchainInfo()
      .then(info => info.chain)
      .catch(() => '')

    const newOne = {
      id: uuid(),
      name,
      remote,
      type,
      chain,
    }

    await this.updateAll([...list, newOne])
    return newOne
  }

  @Validate
  public async update(@Required id: NetworkID, @Required options: Partial<Network>) {
    const list = await this.getAll()
    const network = list.find(item => item.id === id)
    if (!network) {
      throw new NetworkNotFound(id)
    }

    Object.assign(network, options)
    if (!options.chain) {
      const core = new Core(network.remote)
      const chain = await core.rpc
        .getBlockchainInfo()
        .then(info => info.chain)
        .catch(() => '')
      network.chain = chain
    }

    this.updateAll(list)
    const currentID = await this.getCurrentID()
    if (currentID === id) {
      await this.activate(id)
    }
  }

  @Validate
  public async delete(@Required id: NetworkID) {
    const networkToDelete = await this.get(id)
    if (!networkToDelete) {
      throw new NetworkNotFound(id)
    }
    if (networkToDelete.type === NetworkType.Default) {
      throw new DefaultNetworkUnremovable()
    }

    const prevNetworkList = await this.getAll()
    const currentNetworkList = prevNetworkList.filter(item => item.id !== id)
    this.updateAll(currentNetworkList)
  }

  @Validate
  public async activate(@Required id: NetworkID) {
    const network = await this.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }
    this.writeSync(NetworksKey.Current, id)

    const core = new Core(network.remote)

    const chain = await core.rpc
      .getBlockchainInfo()
      .then(info => info.chain)
      .catch(() => '')

    if (chain && chain !== network.chain) {
      this.update(id, { chain })
    }
  }

  public getCurrentID = async () => {
    return (await this.read<string>(NetworksKey.Current)) || null
  }

  public defaultOne = async () => {
    const list = await this.getAll()
    return list.find(item => item.type === NetworkType.Default) || null
  }
}
