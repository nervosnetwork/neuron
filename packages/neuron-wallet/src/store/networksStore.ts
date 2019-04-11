import Store from 'electron-store'

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

const store = new Store({
  name: 'network',
})

export default store
