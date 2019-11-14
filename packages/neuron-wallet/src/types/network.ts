export type NetworkID = string
export type NetworkName = string
export type NetworkRemote = string
export type NetworkGenesisHash = string

export enum NetworksKey {
  List = 'networks',
  Current = 'selected',
}

export enum NetworkType {
  Default, // Preset mainnet node
  Normal,
}

export const MAINNET_GENESIS_HASH = "0x" // TODO: set this when mainnet launches!

export interface Network {
  name: NetworkName
  remote: NetworkRemote
  type: NetworkType
  genesisHash: NetworkGenesisHash
  chain: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string // returned by rpc.getBlockchainInfo
}

export interface NetworkWithID extends Network {
  id: NetworkID
}
