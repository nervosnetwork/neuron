import Core from '@nervosnetwork/ckb-sdk-core'
import { v4 as uuid } from 'uuid'
import { BehaviorSubject } from 'rxjs'
import { LackOfDefaultNetwork, DefaultNetworkUnremovable } from 'exceptions/network'

import Store from 'models/store'

import { Validate, Required } from 'decorators'
import { UsedName, NetworkNotFound, InvalidFormat } from 'exceptions'
import { NetworkListSubject, CurrentNetworkIDSubject } from 'models/subjects/networks'
import { MAINNET_GENESIS_HASH, EMPTY_GENESIS_HASH, NetworkID, NetworkName, NetworkRemote, NetworksKey, NetworkType, Network, NetworkWithID } from 'types/network'

export const networkSwitchSubject = new BehaviorSubject<undefined | NetworkWithID>(undefined)

const presetNetworks: { selected: string, networks: NetworkWithID[] } = {
  selected: 'mainnet',
  networks: [
    {
      id: 'mainnet',
      name: 'Mainnet',
      remote: 'http://localhost:8114',
      genesisHash: MAINNET_GENESIS_HASH,
      type: NetworkType.Default,
      chain: 'ckb',
    }
  ]
}

export default class NetworksService extends Store {
  private static instance: NetworksService

  public static getInstance = () => {
    if (!NetworksService.instance) {
      NetworksService.instance = new NetworksService()
    }
    return NetworksService.instance
  }

  constructor() {
    super('networks', 'index.json', JSON.stringify(presetNetworks))

    const currentNetworkList = this.getAll()
    NetworkListSubject.next({ currentNetworkList })

    const currentNetwork = this.getCurrent()
    if (currentNetwork) {
      if (currentNetwork.type !== NetworkType.Default) {
        this.update(currentNetwork.id, {}) // Update to trigger chain/genesis hash refresh
      }

      CurrentNetworkIDSubject.next({ currentNetworkID: currentNetwork.id })
      networkSwitchSubject.next(currentNetwork)
    }

    this.on(NetworksKey.List, async (_, currentNetworkList: NetworkWithID[] = []) => {
      NetworkListSubject.next({ currentNetworkList })

      const currentID = this.getCurrentID()
      if (currentNetworkList.find(network => network.id === currentID)) {
        return
      }

      const defaultNetwork = this.defaultOne()
      if (!defaultNetwork) {
        throw new LackOfDefaultNetwork()
      }
      this.activate(defaultNetwork.id)
    })

    this.on(NetworksKey.Current, async (_, currentNetworkID: NetworkID) => {
      const currentNetwork = this.get(currentNetworkID)
      if (!currentNetwork) {
        throw new NetworkNotFound(currentNetworkID)
      }
      CurrentNetworkIDSubject.next({ currentNetworkID })
      networkSwitchSubject.next(currentNetwork)
    })
  }

  public getAll = () => {
    return this.readSync<NetworkWithID[]>(NetworksKey.List) || presetNetworks.networks
  }

  public getCurrent(): NetworkWithID {
    return this.get(this.getCurrentID()) || this.defaultOne()! // Should always have at least one network
  }

  public get(@Required id: NetworkID) {
    const list = this.getAll()
    return list.find(item => item.id === id) || null
  }

  public updateAll(@Required networks: NetworkWithID[]) {
    if (!Array.isArray(networks)) {
      throw new InvalidFormat('Networks')
    }
    this.writeSync(NetworksKey.List, networks)
  }

  @Validate
  public async create(@Required name: NetworkName, @Required remote: NetworkRemote, type: NetworkType = NetworkType.Normal) {
    const list = this.getAll()
    if (list.some(item => item.name === name)) {
      throw new UsedName('Network')
    }

    const core = new Core(remote)

    const chain = await core.rpc
      .getBlockchainInfo()
      .then(info => info.chain)
      .catch(() => 'ckb_dev')
    const genesisHash = await core.rpc
      .getBlockHash('0x0')
      .catch(() => EMPTY_GENESIS_HASH)

    const newOne = {
      id: uuid(),
      name,
      remote,
      genesisHash,
      type,
      chain,
    }

    this.updateAll([...list, newOne])
    return newOne
  }

  @Validate
  public async update(@Required id: NetworkID, @Required options: Partial<Network>) {
    const list = this.getAll()
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
        .catch(() => 'ckb_dev')
      network.chain = chain

      const genesisHash = await core.rpc
        .getBlockHash('0x0')
        .catch(() => EMPTY_GENESIS_HASH)
      network.genesisHash = genesisHash
    }

    this.updateAll(list)

    if (this.getCurrentID() === id) {
      CurrentNetworkIDSubject.next({ currentNetworkID: id })
      networkSwitchSubject.next(network)
    }
  }

  @Validate
  public async delete(@Required id: NetworkID) {
    const networkToDelete = this.get(id)
    if (!networkToDelete) {
      throw new NetworkNotFound(id)
    }
    if (networkToDelete.type === NetworkType.Default) {
      throw new DefaultNetworkUnremovable()
    }

    const prevNetworkList = this.getAll()
    const currentNetworkList = prevNetworkList.filter(item => item.id !== id)
    this.updateAll(currentNetworkList)
  }

  @Validate
  public async activate(@Required id: NetworkID) {
    const network = this.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }

    // No need to update the default mainnet's genesis hash
    if (network.type !== NetworkType.Default) {
      this.update(id, {})
    }

    this.writeSync(NetworksKey.Current, id)
  }

  public getCurrentID = () => {
    return this.readSync<string>(NetworksKey.Current) || 'mainnet'
  }

  public defaultOne = () => {
    return this.getAll().find(item => item.type === NetworkType.Default) || presetNetworks.networks[0]
  }

  public isMainnet = (): boolean => {
    return this.getCurrent().chain === 'ckb'
  }

  public explorerUrl = (): string => {
    if (this.isMainnet()) {
      return "https://explorer.nervos.org"
    }
    return "https://explorer.nervos.org/testnet"
  }
}
