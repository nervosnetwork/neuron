import { Transaction } from 'types/cell-types'
import { TransactionsService, PaginationResult, TransactionsByLockHashesParam } from 'services/tx'

import AddressesService from 'services/addresses'
import WalletsService from 'services/wallets'

import { ResponseCode } from 'utils/const'
import { TransactionNotFound, CurrentWalletNotSet, ServiceHasNoResponse } from 'exceptions'
import LockUtils from 'models/lock-utils'

const CELL_COUNT_THRESHOLD = 10

export default class TransactionsController {
  public static async getAll(
    params: TransactionsByLockHashesParam,
  ): Promise<Controller.Response<PaginationResult<Transaction>>> {
    const transactions = await TransactionsService.getAll(params)

    if (!transactions) {
      throw new ServiceHasNoResponse('Transactions')
    }

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  public static async getAllByKeywords(
    params: Controller.Params.TransactionsByKeywords,
  ): Promise<Controller.Response<PaginationResult<Transaction> & Controller.Params.TransactionsByKeywords>> {
    const { pageNo = 1, pageSize = 15, keywords = '', walletID = '' } = params

    const addresses = AddressesService.allAddressesByWalletId(walletID).map(addr => addr.address)

    const transactions = await TransactionsService
      .getAllByAddresses({ pageNo, pageSize, addresses }, keywords.trim())
      .catch(() => ({
        totalCount: 0,
        items: []
      }))

    return {
      status: ResponseCode.Success,
      result: {
        ...params,
        ...transactions,
        keywords,
        walletID,
      },
    }
  }

  public static async getAllByAddresses(
    params: Controller.Params.TransactionsByAddresses,
  ): Promise<Controller.Response<PaginationResult<Transaction> & Controller.Params.TransactionsByAddresses>> {
    const { pageNo, pageSize, addresses = '' } = params

    let searchAddresses = addresses
      .split(',')
      .map(addr => addr.trim())
      .filter(addr => addr !== '')

    if (!searchAddresses.length) {
      const wallet = WalletsService.getInstance().getCurrent()
      if (!wallet) {
        throw new CurrentWalletNotSet()
      }
      searchAddresses = AddressesService.allAddressesByWalletId(wallet.id).map(addr => addr.address)
    }

    const transactions = await TransactionsService.getAllByAddresses({ pageNo, pageSize, addresses: searchAddresses })

    if (!transactions) {
      throw new ServiceHasNoResponse('Transactions')
    }
    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  public static async get(
    walletID: string,
    hash: string,
  ): Promise<Controller.Response<Transaction & { outputsCount: string; inputsCount: string }>> {
    const transaction = await TransactionsService.get(hash)

    if (!transaction) {
      throw new TransactionNotFound(hash)
    }

    const wallet = WalletsService.getInstance().get(walletID)
    if (!wallet) {
      throw new CurrentWalletNotSet()
    }
    const addresses: string[] = (await AddressesService.allAddressesByWalletId(wallet.id)).map(addr => addr.address)
    const lockHashes: string[] = new LockUtils(await LockUtils.systemScript()).addressesToAllLockHashes(addresses)

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
      transaction.inputs = transaction.inputs.slice(0, CELL_COUNT_THRESHOLD)
    }
    const outputsCount = transaction.outputs ? transaction.outputs.length.toString() : '0'
    if (transaction.outputs) {
      transaction.outputs = transaction.outputs
        .sort((o1, o2) => +o1.outPoint!.index - +o2.outPoint!.index)
        .slice(0, CELL_COUNT_THRESHOLD)
    }

    return {
      status: ResponseCode.Success,
      result: { ...transaction, outputsCount, inputsCount },
    }
  }

  public static async updateDescription({ hash, description }: { hash: string; description: string }) {
    await TransactionsService.updateDescription(hash, description)

    return {
      status: ResponseCode.Success,
      result: {
        hash,
        description,
      },
    }
  }
}
