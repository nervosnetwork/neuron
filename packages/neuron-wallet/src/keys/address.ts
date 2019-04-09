import TransactionsService from '../services/transactions'

const Address = {
  isUsedAddress: (address: string) => {
    return TransactionsService.hasTransactions(address)
  },

  addressFromPrivateKey: (privateKey: string) => {
    // TODO: generate address from private key
    return `ckb${privateKey}`
  },
}

export default Address
