import CKB from '@nervosnetwork/ckb-sdk-core'
import { v4 as uuid } from 'uuid'
import { DefaultNetworkUnremovable } from 'exceptions/network'

import Store from 'models/store'

import { Validate, Required } from 'utils/validators'
import { UsedName, NetworkNotFound, InvalidFormat } from 'exceptions'
import { MAINNET_GENESIS_HASH, EMPTY_GENESIS_HASH, NetworkType, Network } from 'models/network'
import CommonUtils from 'utils/common'

const presetNetworks: { selected: string; networks: Network[] } = {
  selected: 'mainnet',
  networks: [
    {
      id: 'mainnet',
      name: 'Default',
      remote: 'http://localhost:8114',
      genesisHash: MAINNET_GENESIS_HASH,
      type: NetworkType.Default,
      chain: 'ckb'
    }
  ]
}

enum NetworksKey {
  List = 'networks',
  Current = 'selected'
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

    const currentNetwork = this.getCurrent()
    this.update(currentNetwork.id, {}) // Update to trigger chain/genesis hash refresh
  }

  public getAll = () => {
    const networks = this.readSync<Network[]>(NetworksKey.List) || presetNetworks.networks
    const defaultNetwork = networks[0]
    const isOldDefaultName = ['Default', 'Mainnet'].includes(networks[0].name)
    defaultNetwork.name = isOldDefaultName ? 'default node' : defaultNetwork.name
    return networks
  }

  public getCurrent(): Network {
    return this.get(this.getCurrentID()) || this.defaultOne()! // Should always have at least one network
  }

  public get(@Required id: string) {
    const list = this.getAll()
    return list.find(item => item.id === id) || null
  }

  public updateAll(@Required networks: Network[]) {
    if (!Array.isArray(networks)) {
      throw new InvalidFormat('Networks')
    }
    this.writeSync(NetworksKey.List, networks)
  }

  @Validate
  public async create(@Required name: string, @Required remote: string, type: NetworkType = NetworkType.Normal) {
    const list = this.getAll()
    if (list.some(item => item.name === name)) {
      throw new UsedName('Network')
    }

    const properties = {
      id: uuid(),
      name,
      remote,
      type,
      genesisHash: EMPTY_GENESIS_HASH,
      chain: 'ckb_dev'
    }
    const network = await CommonUtils.timeout(2000, this.refreshChainInfo(properties), properties).catch(
      () => properties
    )

    this.updateAll([...list, network])
    return network
  }

  @Validate
  public async update(@Required id: string, @Required options: Partial<Network>) {
    const list = this.getAll()
    const network = list.find(item => item.id === id)
    if (!network) {
      throw new NetworkNotFound(id)
    }

    Object.assign(network, options)
    Object.assign(
      network,
      await CommonUtils.timeout(2000, this.refreshChainInfo(network), network).catch(() => network)
    )

    this.updateAll(list)
    return network
  }

  @Validate
  public async delete(@Required id: string) {
    const networkToDelete = this.get(id)
    if (!networkToDelete) {
      throw new NetworkNotFound(id)
    }
    if (networkToDelete.type === NetworkType.Default) {
      throw new DefaultNetworkUnremovable()
    }

    if (this.getCurrentID() === id) {
      this.writeSync(NetworksKey.Current, null)
    }

    const list = this.getAll().filter(item => item.id !== id)
    this.updateAll(list)
  }

  @Validate
  public async activate(@Required id: string) {
    const network = this.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }
    this.update(id, {}) // Trigger chain info refresh

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
      return 'https://explorer.nervos.org'
    }
    return 'https://explorer.nervos.org/aggron'
  }

  // Refresh a network's genesis and chain info
  private async refreshChainInfo(network: Network): Promise<Network> {
    const ckb = new CKB(network.remote)

    const genesisHash = await ckb.rpc.getBlockHash('0x0').catch(() => EMPTY_GENESIS_HASH)
    const chain = await ckb.rpc
      .getBlockchainInfo()
      .then(info => info.chain)
      .catch(() => '')

    if (genesisHash !== network.genesisHash && chain !== '') {
      network.genesisHash = genesisHash
      network.chain = chain
    }

    return network
  }
}
