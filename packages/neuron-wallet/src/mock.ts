export const transactions = Array.from({
  length: 200,
}).map(() => ({
  date: new Date(),
  value: Math.random(),
  hash: Math.round(Math.random() * 10000000000000000),
}))

export const transactionCount = 500

export interface Wallet {
  name: string
  id: string
  balance: number
  address: string
  publicKey: Uint8Array
  msg: string
  password: string
  mnemonic: string
}

const generateWallet = () => {
  const walletID = `wallet${parseInt((Math.random() * 1000).toString(), 10)}`
  return {
    name: walletID,
    id: walletID,
    balance: 0,
    address: '',
    publicKey: new Uint8Array(0),
    msg: '',
    password: '1qaz',
    mnemonic: '',
  }
}

let list: Wallet[] = []

export const wallets = () => {
  if (list.length === 0) {
    list = [generateWallet(), generateWallet(), generateWallet(), generateWallet(), generateWallet()]
  }
  return list
}

export default {
  transactions,
  transactionCount,
  wallets,
}
