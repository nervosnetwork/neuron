import { AddressType } from 'models/keys/address'
import { TransactionsService } from 'services/tx'
import CellsService from 'services/cells'
import Store from 'models/store'
import AddressDbChangedSubject from 'models/subjects/address-db-changed-subject'
import { TransactionStatus } from 'models/chain/transaction'
import AddressParser from 'models/address-parser'

export enum AddressVersion {
  Testnet = 'testnet',
  Mainnet = 'mainnet',
}

export interface Address {
  walletId: string
  address: string
  path: string
  addressType: AddressType
  addressIndex: number
  txCount: number
  liveBalance: string
  sentBalance: string
  pendingBalance: string
  balance: string
  blake160: string
  version: AddressVersion
  description?: string
  isImporting?: boolean | undefined
}

export default class AddressDao {
  public static create = (addresses: Address[]): Address[] => {
    const result = addresses.map(address => {
      address.txCount = address.txCount || 0
      address.liveBalance = address.liveBalance || '0'
      address.sentBalance = address.sentBalance || '0'
      address.pendingBalance = address.pendingBalance || '0'
      address.balance = (BigInt(address.liveBalance) + BigInt(address.sentBalance)).toString()
      return address
    })
    return AddressStore.add(result)
  }

  public static getAll(): Address[] {
    return AddressStore.getAll()
  }

  // txCount include all txs in db
  // liveBalance means balance of OutputStatus.Live cells (already in chain and not spent)
  // sentBalance means balance of OutputStatus.Sent cells (sent to me but not committed)
  // pendingBalance means balance of OutputStatus.Pending cells (sent from me, but not committed)
  // so the final balance is (liveBalance + sentBalance - pendingBalance)
  // balance is the balance of the cells those who don't hold data or type script
  public static async updateTxCountAndBalances(addresses: string[]): Promise<Address[]> {
    const addressesSet = new Set(addresses)
    const all = AddressStore.getAll()
    const toUpdate = all.filter(value => {
      return addressesSet.has(value.address)
    })
    const others = all.filter(value => {
      return !addressesSet.has(value.address)
    })

    const lockHashInfo = new Map<string, string>()
    const lockHashes = new Set<string>()
    toUpdate.forEach(addr => {
      const address = addr.address
      const lockHash: string = AddressParser.parse(address).computeHash()
      lockHashInfo.set(address, lockHash)
      lockHashes.add(lockHash)
    })

    const balanceInfo = await CellsService.getBalance(lockHashes)
    const txCountInfo = await TransactionsService.getCountByLockHashesAndStatus(lockHashes, new Set([
      TransactionStatus.Pending,
      TransactionStatus.Success,
    ]))

    const updated: Address[] = toUpdate.map(addr => {
      const lockHash: string = lockHashInfo.get(addr.address)!
      const liveBalance = balanceInfo.liveBalance.get(lockHash) || '0'
      const sentBalance = balanceInfo.sentBalance.get(lockHash) || '0'
      const pendingBalance = balanceInfo.pendingBalance.get(lockHash) || '0'
      return {
        ...addr,
        txCount: txCountInfo.get(lockHash) || 0,
        liveBalance,
        sentBalance,
        pendingBalance,
        balance: (BigInt(liveBalance) + BigInt(sentBalance)).toString(),
      }
    })

    AddressStore.updateAll(updated.concat(others))
    return updated
  }

  public static resetAddresses = () => {
    const all = AddressStore.getAll()
    all.forEach(addr => {
      addr.txCount = 0
      addr.liveBalance = '0'
      addr.sentBalance = '0'
      addr.pendingBalance = '0'
      addr.balance = '0'
    })
    AddressStore.updateAll(all)
  }

  public static nextUnusedAddress(walletId: string, version: AddressVersion): Address | undefined {
    const addresses = AddressStore.getAll().filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Receiving
        && value.txCount === 0
    })
    return addresses.sort((lhs, rhs) => {
      return lhs.addressIndex - rhs.addressIndex
    })[0]
  }

  public static unusedAddressesCount(walletId: string, version: AddressVersion): [number, number] {
    const addresses = AddressStore.getAll()
    const receivingCount = addresses.filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Receiving
        && value.txCount === 0
    }).length
    const changeCount = addresses.filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Change
        && value.txCount === 0
    }).length

    return [receivingCount, changeCount]
  }

  public static nextUnusedChangeAddress(walletId: string, version: AddressVersion): Address | undefined {
    const addresses = AddressStore.getAll().filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.addressType == AddressType.Change
        && value.txCount === 0
    })
    return addresses.sort((lhs, rhs) => {
      return lhs.addressIndex - rhs.addressIndex
    })[0]
  }

  public static allAddresses(version: AddressVersion): Address[] {
    const all = AddressStore.getAll()
    return all.filter(value => {
      return value.version === version
    })
  }

  public static allAddressesByWalletId(walletId: string, version: AddressVersion): Address[] {
    return AddressStore.getAll()
      .filter(value => value.walletId === walletId && value.version === version)
      .sort((lhs, rhs) => {
        return lhs.addressType - rhs.addressType || lhs.addressIndex - rhs.addressIndex
      })
  }

  public static usedAddressesByWalletId(walletId: string, version: AddressVersion): Address[] {
    const all = AddressStore.getAll()
    return all.filter(value => {
      return value.walletId === walletId
        && value.version === version
        && value.txCount !== 0
    })
  }

  public static findByAddresses(addresses: string[]): Address[] {
    return AddressStore.getAll().filter(value => {
      return addresses.includes(value.address)
    })
  }

  public static maxAddressIndex(walletId: string, addressType: AddressType, version: AddressVersion): Address | undefined {
    const addresses = AddressStore.getAll().filter(value => {
      return value.walletId === walletId
        && value.addressType === addressType
        && value.version === version
    })
    return addresses.sort((lhs, rhs) => {
      return lhs.addressIndex > rhs.addressIndex ? -1 : 1
    })[0]
  }

  public static updateDescription(walletId: string, address: string, description: string): Address | undefined {
    const item = AddressStore.getAll().find(value => {
      return value.walletId === walletId
        && value.address === address
    })
    if (!item) {
      return undefined
    }
    item.description = description
    return AddressStore.update(item)
  }

  public static deleteByWalletId(walletId: string): Address[] {
    const all = AddressStore.getAll()
    const toKeep = all.filter(value => {
      return value.walletId !== walletId
    })
    const deleted = all.filter(value => {
      return value.walletId === walletId
    })
    AddressStore.updateAll(toKeep)

    return deleted
  }

  public static updateAll(addresses: Address[]) {
    AddressStore.updateAll(addresses)
  }

  public static deleteAll() {
    AddressStore.updateAll([])
  }
}

/// Persist all addresses as array in `addresses/index.json`.
class AddressStore {
  static MODULE_NAME = 'addresses'
  static ROOT_KEY = 'addresses'
  static store = new Store(AddressStore.MODULE_NAME, 'index.json', '{}')

  static getAll(): Address[] {
    const root = AddressStore.store.readSync<Address[]>(AddressStore.ROOT_KEY)
    return root || []
  }

  static updateAll(addresses: Address[]) {
    AddressStore.store.writeSync(AddressStore.ROOT_KEY, addresses)
    AddressStore.changed()
  }

  static add(addresses: Address[]): Address[] {
    const all = AddressStore.getAll()
    for (let address of addresses) {
      all.push(address)
    }

    AddressStore.updateAll(all)

    return addresses
  }

  static update(address: Address): Address {
    const all = AddressStore.getAll()
    const exist = all.findIndex(value => {
      return value.walletId === address.walletId && value.address === address.address
    })
    if (exist !== -1) {
      all[exist] = address
    } else {
      all.push(address)
    }

    AddressStore.updateAll(all)

    return address
  }

  static changed() {
    AddressDbChangedSubject.getSubject().next("Updated")
  }
}
