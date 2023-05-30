import { v4 as uuid } from 'uuid'
import { DefaultNetworkUnremovable } from '../exceptions/network'

import Store from '../models/store'

import { Validate, Required } from '../utils/validators'
import { UsedName, NetworkNotFound, InvalidFormat } from '../exceptions'
import { MAINNET_GENESIS_HASH, EMPTY_GENESIS_HASH, NetworkType, Network, TESTNET_GENESIS_HASH } from '../models/network'
import CommonUtils from '../utils/common'
import { BUNDLED_CKB_URL, BUNDLED_LIGHT_CKB_URL, LIGHT_CLIENT_TESTNET } from '../utils/const'
import { generateRPC } from '../utils/ckb-rpc'

const presetNetworks: { selected: string; networks: Network[] } = {
  selected: 'mainnet',
  networks: [
    {
      id: 'mainnet',
      name: 'Default',
      remote: BUNDLED_CKB_URL,
      genesisHash: MAINNET_GENESIS_HASH,
      type: NetworkType.Default,
      chain: 'ckb',
    },
  ],
}

const lightClientNetwork: Network[] = [
  {
    id: 'light_client_testnet',
    name: 'Light Client Testnet',
    remote: BUNDLED_LIGHT_CKB_URL,
    genesisHash: TESTNET_GENESIS_HASH,
    type: NetworkType.Light,
    chain: LIGHT_CLIENT_TESTNET,
  },
]

enum NetworksKey {
  List = 'networks',
  Current = 'selected',
  AddedLightNetwork = 'AddedLightNetwork',
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
    const addLight = this.readSync<boolean>(NetworksKey.AddedLightNetwork)
    if (!addLight) {
      const networks = this.readSync<Network[]>(NetworksKey.List) || presetNetworks.networks
      this.updateAll([...networks, ...lightClientNetwork])
      this.writeSync(NetworksKey.AddedLightNetwork, true)
    }
  }

  public getAll = () => {
    const networks = this.readSync<Network[]>(NetworksKey.List) || presetNetworks.networks
    networks.forEach(network => {
      // Currently, the RPC interface of the CKB node is bound to IPv4 by default.
      // Starting from node17, its DNS resolution is no longer `ipv4first`.
      // Therefore, to ensure normal connection to the ckb node, manual resolution needs to be done here.
      network.remote = applyLocalhostIPv4Resolve(network.remote)
    })
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
      chain: 'ckb_dev',
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
    return 'https://pudge.explorer.nervos.org'
  }

  // Refresh a network's genesis and chain info
  private async refreshChainInfo(network: Network): Promise<Network> {
    const rpc = generateRPC(network.remote)

    const genesisHash = await rpc.getGenesisBlockHash().catch(() => EMPTY_GENESIS_HASH)
    const chain = await rpc
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

function applyLocalhostIPv4Resolve(url: string): string {
  let urlObj
  try {
    urlObj = new URL(url)
  } catch (err) {
    return url
  }

  if (urlObj.hostname !== 'localhost') return url

  urlObj.hostname = '127.0.0.1'
  // When the pathname is empty, the URL constructor automatically sets the pathname
  // to '/' and this needs to be handled.
  const hasExtraPathSeparator = urlObj.pathname === '/' && !url.endsWith('/')
  return hasExtraPathSeparator ? urlObj.href.slice(0, -1) : urlObj.href
}
