export type NetworkID = string
export type NetworkName = string
export type NetworkRemote = string
export enum NetworksKey {
  List = 'list',
  Current = 'current',
}

export enum NetworkType {
  Default,
  Normal,
}

export interface Network {
  name: NetworkName
  remote: NetworkRemote
  type: NetworkType
  chain: 'ckb' | 'ckb_testnet' | 'ckb_dev' | string // returned by rpc.getBlockchainInfo
}
export interface NetworkWithID extends Network {
  id: NetworkID
}
