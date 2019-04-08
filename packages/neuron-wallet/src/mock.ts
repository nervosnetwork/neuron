import { v4 } from 'uuid'

export const transactions = Array.from({
  length: 200,
})
  .map(() => ({
    date: new Date().getTime() - Math.round(Math.random() * 100000000),
    value: `${Math.random()}`,
    hash: `${Math.round(Math.random() * 10000000000000000)}`,
    type: Math.round(Math.random() * 2),
  }))
  .sort((p, n) => +n.date - +p.date)

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
  const walletName = `wallet${parseInt((Math.random() * 1000).toString(), 10)}`
  const walletID = v4()
  return {
    name: walletName,
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

export const updateWallets = (newWallets: Wallet[]) => {
  list = newWallets
}

export const verifyPassword = (wallet: Wallet, password: string) => {
  if (wallet.password === password) {
    return true
  }
  return false
}

export const mockedTransaction = {
  hash: '0x3abd21e6e51674bb961bb4c5f3cee9faa5da30e64be10628dc1cef292cbae324',
  version: 0,
  deps: [],
  inputs: [
    {
      previous_output: {
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        index: 4294967295,
      },
      unlock: {
        args: [],
        binary: '0x0100000000000000',
        reference: null,
        signed_args: [],
        version: 0,
      },
    },
  ],
  outputs: [
    {
      capacity: 5000000,
      data: '0x',
      lock: '0x0da2fe99fe549e082d4ed483c2e968a89ea8d11aabf5d79e5cbf06522de6e674',
      type: null,
    },
  ],
  time: 1545992487397,
  value: '1000',
}

const transaction = {
  date: new Date(),
  amount: Math.round(Math.random() * 10000),
}

export const transactionHashGen = () => `0x${Math.round(Math.random() * 100)}`

export default {
  transactions,
  transactionCount,
  wallets,
  mockedTransaction,
  transaction,
  transactionHashGen,
}
