import { TransactionsService, PaginationResult } from 'services/tx'
import AddressesService from 'services/addresses'
import WalletsService from 'services/wallets'

import { ResponseCode } from 'utils/const'
import { TransactionNotFound, CurrentWalletNotSet } from 'exceptions'
import LockUtils from 'models/lock-utils'
import Transaction from 'models/chain/transaction'

import { set as setDescription, get as getDescription } from 'database/leveldb/transaction-description'

export default class TransactionsController {
  public async getAll(params: Controller.Params.TransactionsByKeywords):
    Promise<Controller.Response<PaginationResult<Transaction> & Controller.Params.TransactionsByKeywords>> {
    const { pageNo = 1, pageSize = 15, keywords = '', walletID = '' } = params

    const addresses = AddressesService.allAddressesByWalletId(walletID).map(addr => addr.address)

    const transactions = await TransactionsService
      .getAllByAddresses({ pageNo, pageSize, addresses }, keywords.trim())
      .catch(() => ({
        totalCount: 0,
        items: [] as Transaction[]
      }))
    transactions.items = await Promise.all(transactions.items.map(async tx => {
      const description = await getDescription(walletID, tx.hash!)
      if (description !== '') {
        tx.description = description
      } else if (tx.description !== '') {
        // Legacy data has description but leveldb doesn't have it.
        await setDescription(walletID, tx.hash!, tx.description)
      }
      return tx
    }))

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions, keywords, walletID }
    }
  }

  private cellCountThreshold = 10
  public async get(walletID: string, hash: string):
    Promise<Controller.Response<Transaction & { outputsCount: string; inputsCount: string }>> {
    const transaction = await TransactionsService.get(hash)
    if (!transaction) {
      throw new TransactionNotFound(hash)
    }

    const wallet = WalletsService.getInstance().get(walletID)
    if (!wallet) {
      throw new CurrentWalletNotSet()
    }

    const addresses: string[] = AddressesService.allAddressesByWalletId(wallet.id).map(addr => addr.address)
    const lockHashes: string[] = new LockUtils().addressesToAllLockHashes(addresses)

    const outputCapacities: bigint = transaction
      .outputs!.filter(o => lockHashes.includes(o.lockHash!))
      .map(o => BigInt(o.capacity))
      .reduce((result, c) => result + c, BigInt(0))
    const inputCapacities: bigint = transaction
      .inputs!.filter(i => {
        if (i.lockHash) {
          return lockHashes.includes(i.lockHash)
        }
        return false
      })
      .map(i => BigInt(i.capacity || 0))
      .reduce((result, c) => result + c, BigInt(0))
    const value: bigint = outputCapacities - inputCapacities
    transaction.value = value.toString()
    const inputsCount = transaction.inputs ? transaction.inputs.length.toString() : '0'
    if (transaction.inputs) {
      transaction.inputs = transaction.inputs.slice(0, this.cellCountThreshold)
    }
    const outputsCount = transaction.outputs ? transaction.outputs?.length.toString() : '0'
    if (transaction.outputs) {
      transaction.outputs = transaction.outputs
        .sort((o1, o2) => +o1.outPoint!.index - +o2.outPoint!.index)
        .slice(0, this.cellCountThreshold)
    }

    transaction.description = await getDescription(walletID, hash)

    return {
      status: ResponseCode.Success,
      result: { ...transaction, outputsCount, inputsCount } as Transaction & { outputsCount: string; inputsCount: string }
    }
  }

  public async updateDescription({ walletID, hash, description }: { walletID: string; hash: string; description: string }) {
    await setDescription(walletID, hash, description)

    return {
      status: ResponseCode.Success,
      result: { hash, description }
    }
  }
}
