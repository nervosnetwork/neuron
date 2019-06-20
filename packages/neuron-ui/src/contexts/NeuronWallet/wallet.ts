export interface WalletIdentity {
  name: string
  id: string
}
export interface Wallet extends WalletIdentity {
  balance: string
  addresses: Addresses
  publicKey: Uint8Array
  message: string
  sending: boolean
}
export interface Address {
  address: string
  description: string
}

export interface Addresses {
  receiving: Address[]
  change: Address[]
}

export const walletState: Wallet = {
  name: '',
  id: '',
  balance: '0',
  addresses: { receiving: [], change: [] },
  publicKey: new Uint8Array(0),
  message: '',
  sending: false,
}

export default walletState
