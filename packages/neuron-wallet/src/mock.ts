import { v4 } from 'uuid'

export const transactions = Array.from({
  length: 200,
})
  .map(() => ({
    time: `${new Date().getTime() - Math.round(Math.random() * 100000000)}`,
    value: `${Math.random()}`,
    hash: `${Math.round(Math.random() * 10000000000000000)}`,
    version: 0,
    type: Math.round(Math.random()),
  }))
  .sort((p, n) => +n.time - +p.time)

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
  deps: [
    {
      hash: '0x8d37f0856ebb70c12871830667d82224e6619896c7f12bb73a14dd9329af9c8d',
      index: 0,
    },
  ],
  inputs: [
    {
      previousOutput: {
        hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        index: 4294967295,
      },
      args: [],
    },
  ],
  outputs: [
    {
      capacity: '5000000',
      data: '0x',
      lock: {
        args: [
          '0x65323139336466353164373834313136303137393662333562313762346638663263643835626430616461383834326166323365303836633136396133316432',
        ],
        binaryHash: '0x8bddddc3ae2e09c13106634d012525aa32fc47736456dba11514d352845e561d',
      },
      type: null,
    },
  ],
  time: '1545992487397',
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
