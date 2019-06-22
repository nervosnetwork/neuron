export interface WalletIdentity {
  name: string
  id: string
}
export interface Wallet extends WalletIdentity {
  balance: string
  addresses: Address[]
  publicKey: Uint8Array
  message: string
  sending: boolean
}
export interface Address {
  address: string
  identifier: string
  description: string
  type: 0 | 1 // 0 for receiving, 1 for change
  txCount: number
}

export const walletState: Wallet = {
  name: '',
  id: '',
  balance: '0',
  addresses: [],
  publicKey: new Uint8Array(0),
  message: '',
  sending: false,
}

export default walletState
