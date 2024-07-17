import { v4 as uuid } from 'uuid'
import { DefaultNetworkUnremovable } from '../exceptions/network'

import Store from '../models/store'

import { Validate, Required } from '../utils/validators'
import { UsedName, NetworkNotFound, InvalidFormat } from '../exceptions'
import { MAINNET_GENESIS_HASH, EMPTY_GENESIS_HASH, NetworkType, Network, TESTNET_GENESIS_HASH } from '../models/network'
import CommonUtils from '../utils/common'
import {
  BUNDLED_CKB_DEFAULT_PORT,
  BUNDLED_CKB_URL,
  BUNDLED_LIGHT_CKB_URL,
  BUNDLED_LIGHT_DEFAULT_PORT,
  BUNDLED_URL_PREFIX,
  LIGHT_CLIENT_MAINNET,
  LIGHT_CLIENT_TESTNET,
  MAINNET_CLIENT_LIST,
} from '../utils/const'
import { generateRPC } from '../utils/ckb-rpc'
import { CKBLightRunner } from './light-runner'
import { getNodeUrl } from './ckb-runner'

export const presetNetworks: { selected: string; networks: Network[] } = {
  selected: 'mainnet',
  networks: [
    {
      id: 'mainnet',
      name: 'Internal Node',
      remote: BUNDLED_CKB_URL,
      genesisHash: MAINNET_GENESIS_HASH,
      type: NetworkType.Default,
      chain: 'ckb',
      readonly: true,
    },
  ],
}

export const lightClientNetwork: Network[] = [
  {
    id: 'light_client',
    name: 'Light Client',
    remote: BUNDLED_LIGHT_CKB_URL,
    genesisHash: MAINNET_GENESIS_HASH,
    type: NetworkType.Light,
    chain: LIGHT_CLIENT_MAINNET,
    readonly: true,
  },
  {
    id: 'light_client_testnet',
    name: 'Light Client',
    remote: BUNDLED_LIGHT_CKB_URL,
    genesisHash: TESTNET_GENESIS_HASH,
    type: NetworkType.Light,
    chain: LIGHT_CLIENT_TESTNET,
    readonly: true,
  },
]

enum NetworksKey {
  List = 'networks',
  Current = 'selected',
  AddedLightNetwork = 'AddedLightNetwork',
  MigrateNetwork = 'MigrateNetwork',
  AddInternalNetwork = 'AddInternalNetwork',
}

const oldDefaultNames = ['Default', 'default node', presetNetworks.networks[0].name]
// Before 0.106.0 version the default remote's value is http://localhost:8114
// "localhost" was deprecated because of https://github.com/Magickbase/neuron-public-issues/issues/122
const oldDefaultRemotes = ['http://localhost:8114', BUNDLED_CKB_URL]

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

    const addLight = this.readSync<boolean>(NetworksKey.AddedLightNetwork)
    if (!addLight) {
      const networks = this.readSync<Network[]>(NetworksKey.List) || presetNetworks.networks
      this.updateAll([...networks, ...lightClientNetwork])
      this.writeSync(NetworksKey.AddedLightNetwork, true)
    }
    this.migrateNetwork()
    this.addInternalNetwork()
    const currentNetwork = this.getCurrent()
    this.update(currentNetwork.id, {}) // Update to trigger chain/genesis hash refresh
  }

  public getAll = () => {
    const networks = this.readSync<Network[]>(NetworksKey.List) || presetNetworks.networks
    networks.forEach(network => {
      // Currently, the RPC interface of the CKB node is bound to IPv4 by default.
      // Starting from node17, its DNS resolution is no longer `ipv4first`.
      // Therefore, to ensure normal connection to the ckb node, manual resolution needs to be done here.
      network.remote = applyLocalhostIPv4Resolve(network.remote)
    })
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
      readonly: false,
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
    if (!network.readonly) {
      // readonly network chaininfo is immutable
      Object.assign(
        network,
        await CommonUtils.timeout(2000, this.refreshChainInfo(network), network).catch(() => network)
      )
    }

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
    this.update(
      id,
      network.readonly
        ? {
            remote: `${BUNDLED_URL_PREFIX}${
              network.type === NetworkType.Light ? BUNDLED_LIGHT_DEFAULT_PORT : BUNDLED_CKB_DEFAULT_PORT
            }`,
          }
        : {}
    ) // Trigger chain info refresh

    this.writeSync(NetworksKey.Current, id)
  }

  public updateInternalRemote() {
    const current = this.getCurrent()
    if (!current.readonly) {
      return
    }
    const remote = current.type === NetworkType.Light ? CKBLightRunner.getInstance().nodeUrl : getNodeUrl()
    if (current.remote !== remote) {
      this.update(current.id, { remote })
    }
  }

  public getCurrentID = () => {
    return this.readSync<string>(NetworksKey.Current) || 'mainnet'
  }

  public defaultOne = () => {
    return this.getAll().find(item => item.type === NetworkType.Default) || presetNetworks.networks[0]
  }

  public isMainnet = (): boolean => {
    return MAINNET_CLIENT_LIST.includes(this.getCurrent().chain)
  }

  public explorerUrl = (): string => {
    if (this.isMainnet()) {
      return 'https://explorer.nervos.org'
    }
    return 'https://pudge.explorer.nervos.org'
  }

  // Refresh a network's genesis and chain info
  private async refreshChainInfo(network: Network): Promise<Network> {
    const rpc = generateRPC(network.remote, network.type)

    const genesisHash = await rpc.getGenesisBlockHash().catch(() => EMPTY_GENESIS_HASH)
    let chain = network.chain
    if (network.type !== NetworkType.Light) {
      chain = await rpc
        .getBlockchainInfo()
        .then(info => info.chain)
        .catch(() => '')
    } else if (network.chain === 'ckb_dev') {
      if (genesisHash === TESTNET_GENESIS_HASH) chain = LIGHT_CLIENT_TESTNET
      if (genesisHash === MAINNET_GENESIS_HASH) chain = LIGHT_CLIENT_MAINNET
    }
    if (genesisHash !== network.genesisHash && chain !== '') {
      network.genesisHash = genesisHash
      network.chain = chain
    }

    return network
  }

  private migrateNetwork() {
    const migrated = this.readSync<boolean>(NetworksKey.MigrateNetwork)
    if (!migrated) {
      const networks = this.readSync<Network[]>(NetworksKey.List)
      const defaultMainnetNetwork = presetNetworks.networks[0]
      const oldMainnetNetwork = networks.find(v => v.id === defaultMainnetNetwork.id)
      if (oldMainnetNetwork) {
        if (
          // make sure that user has not change the network name
          oldDefaultNames.includes(oldMainnetNetwork.name) &&
          oldDefaultRemotes.includes(oldMainnetNetwork.remote) &&
          oldMainnetNetwork.type === defaultMainnetNetwork.type
        ) {
          this.updateAll([
            defaultMainnetNetwork,
            ...lightClientNetwork,
            ...networks
              .filter(v => v.id !== defaultMainnetNetwork.id && v.type !== NetworkType.Light)
              .map(v => ({ ...v, readonly: false })),
          ])
        } else {
          oldMainnetNetwork.id = uuid()
          oldMainnetNetwork.type = NetworkType.Normal
          this.updateAll([
            defaultMainnetNetwork,
            ...lightClientNetwork,
            ...networks.filter(v => v.type !== NetworkType.Light).map(v => ({ ...v, readonly: false })),
          ])
          this.activate(oldMainnetNetwork.id)
        }
      }
      this.writeSync(NetworksKey.MigrateNetwork, true)
    }
  }

  private addInternalNetwork() {
    const flag = this.readSync<boolean>(NetworksKey.AddInternalNetwork)
    if (!flag) {
      const networks = this.getAll()
      const currentNetwork = this.getCurrent()
      const internalNodeIds = new Set([...presetNetworks.networks, ...lightClientNetwork].map(v => v.id))
      const externalNetworks = networks.filter(v => !internalNodeIds.has(v.id))
      this.updateAll([...presetNetworks.networks, ...lightClientNetwork, ...externalNetworks])
      if (currentNetwork.id === lightClientNetwork[1].id) {
        // set light client default mainnet
        this.writeSync(NetworksKey.Current, lightClientNetwork[0].id)
      }
      this.writeSync(NetworksKey.AddInternalNetwork, true)
    }
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
