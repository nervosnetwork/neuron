import { hd } from '@ckb-lumos/lumos'

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

export interface Address {
  walletId: string
  address: string
  path: string
  addressType: hd.AddressType
  addressIndex: number
  blake160: string
  txCount?: number
  liveBalance?: string
  sentBalance?: string
  pendingBalance?: string
  balance?: string
  version?: AddressVersion
  description?: string
  isImporting?: boolean
  usedByAnyoneCanPay?: boolean
}
