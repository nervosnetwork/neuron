export interface WalletIdentity {
  name: string
  id: string
}
export interface Wallet extends WalletIdentity {
  balance: string
  addresses: Address[]
  sending: boolean
}
export interface Address {
  address: string
  identifier: string
  description: string
  type: 0 | 1 // 0 for receiving, 1 for change
  txCount: number
  balance: string
}

export const walletState: Wallet = {
  name: '',
  id: '',
  balance: '0',
  addresses: [],
  sending: false,
}

export default walletState
