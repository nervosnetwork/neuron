export interface Wallet {
  name: string
  id: string
  balance: number
  address: string
  publicKey: Uint8Array
  message: string
}
export const walletState: Wallet = {
  name: '',
  id: '',
  balance: 0,
  address: '',
  publicKey: new Uint8Array(0),
  message: '',
}

export default walletState
