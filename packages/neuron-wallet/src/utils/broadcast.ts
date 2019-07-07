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
  windowManager.broadcast(Channel.Wallets, 'getCurrent', {
    status: ResponseCode.Success,
    result: currentWallet,
  })
}

export const broadcastAddressList = async (currentID: string) => {
  const addresses = await AddressService.allAddressesByWalletId(currentID).then(addrs =>
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

export const broadcastTransactions = async (currentID: string) => {
  const addresses = await AddressService.usedAddresses(currentID)
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

export const broadcastNetworkList = async (networkList: Controller.Network[]) => {
  windowManager.broadcast(Channel.Networks, 'getAll', {
    status: ResponseCode.Success,
    result: networkList,
  })
}

export const broadcastCurrentNetworkID = async (id: Controller.NetworkID) => {
  windowManager.broadcast(Channel.Networks, 'currentID', {
    status: ResponseCode.Success,
    result: id,
  })
}

export default {
  broadcastCurrentWallet,
  broadcastWalletList,
  broadcastAddressList,
  broadcastTransactions,
  broadcastNetworkList,
  broadcastCurrentNetworkID,
}
