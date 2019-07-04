import windowManager from '../models/window-manager'
import AddressService from '../services/addresses'
import TransactionsService from '../services/transactions'
import { Channel, ResponseCode } from './const'

export const broadcastWalletList = (walletList: Controller.Wallet[]) => {
  windowManager.broadcast(Channel.Wallets, 'getAll', {
    status: ResponseCode.Success,
    result: walletList,
  })
}

export const broadcastCurrentWallet = (wallet: Controller.Wallet | null) => {
  const currentWallet = wallet ? { id: wallet.id, name: wallet.name } : null
  windowManager.broadcast(Channel.Wallets, 'getActive', {
    status: ResponseCode.Success,
    result: currentWallet,
  })
}

export const broadcastAddresses = async (currentId: string) => {
  const addresses = await AddressService.allAddressesByWalletId(currentId).then(addrs =>
    addrs.map(({ address, blake160: identifier, addressType: type, txCount, balance, description = '' }) => ({
      address,
      identifier,
      type,
      txCount,
      description,
      balance,
    }))
  )
  windowManager.broadcast(Channel.Wallets, 'allAddresses', {
    status: ResponseCode.Success,
    result: addresses,
  })
}

export const broadcastTransactions = async (currentId: string) => {
  const addresses = await AddressService.usedAddresses(currentId)
  const params = {
    pageNo: 1,
    pageSize: 100,
    addresses: addresses.map(addr => addr.address),
  }
  const transactions = await TransactionsService.getAllByAddresses(params)
  windowManager.broadcast(Channel.Transactions, 'getAllByAddresses', {
    status: ResponseCode.Success,
    result: { ...params, keywords: '', ...transactions },
  })
}

export default {
  broadcastCurrentWallet,
  broadcastWalletList,
  broadcastAddresses,
  broadcastTransactions,
}
