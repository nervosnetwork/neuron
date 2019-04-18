export interface Wallet {
  name: string
  id: string
  balance: number
  addresses: Addresses
  publicKey: Uint8Array
  message: string
}

interface Addresses {
  receiving: string[]
  change: string[]
}

export const walletState: Wallet = {
  name: '',
  id: '',
  balance: 0,
  addresses: { receiving: [], change: [] },
  publicKey: new Uint8Array(0),
  message: '',
}

export default walletState
