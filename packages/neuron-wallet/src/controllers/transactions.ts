import { Transaction } from 'types/cell-types'
import { TransactionsService, PaginationResult, TransactionsByLockHashesParam } from 'services/tx'

import AddressesService from 'services/addresses'
import WalletsService from 'services/wallets'

import { Controller as ControllerDecorator, CatchControllerError } from 'decorators'
import { Channel, ResponseCode } from 'utils/const'
import { TransactionNotFound, CurrentWalletNotSet, ServiceHasNoResponse } from 'exceptions'
import LockUtils from 'models/lock-utils'

/**
 * @class TransactionsController
 * @description handle messages from transactions channel
 */
@ControllerDecorator(Channel.Transactions)
export default class TransactionsController {
  @CatchControllerError
  public static async getAll(
    params: TransactionsByLockHashesParam
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

  @CatchControllerError
  public static async getAllByKeywords(
    params: Controller.Params.TransactionsByKeywords
  ): Promise<Controller.Response<PaginationResult<Transaction> & Controller.Params.TransactionsByKeywords>> {
    const { pageNo = 1, pageSize = 15, keywords = '', walletID = '' } = params

    const addresses = (await AddressesService.allAddressesByWalletId(walletID)).map(addr => addr.address)

    const transactions = await TransactionsService.getAllByAddresses({ pageNo, pageSize, addresses }, keywords)

    if (!transactions) {
      throw new ServiceHasNoResponse('Transactions')
    }
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

  @CatchControllerError
  public static async getAllByAddresses(
    params: Controller.Params.TransactionsByAddresses
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
      searchAddresses = (await AddressesService.allAddressesByWalletId(wallet.id)).map(addr => addr.address)
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

  @CatchControllerError
  public static async get(walletID: string, hash: string): Promise<Controller.Response<Transaction>> {
    const transaction = await TransactionsService.get(hash)

    if (!transaction) {
      throw new TransactionNotFound(hash)
    }

    const wallet = WalletsService.getInstance().get(walletID)
    if (!wallet) {
      throw new CurrentWalletNotSet()
    }
    const addresses: string[] = (await AddressesService.allAddressesByWalletId(wallet.id)).map(addr => addr.address)
    const lockHashes: string[] = await LockUtils.addressesToAllLockHashes(addresses)

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
      .map(i => BigInt(i.capacity))
      .reduce((result, c) => result + c, BigInt(0))
    const value: bigint = outputCapacities - inputCapacities
    transaction.value = value.toString()
    if (transaction.outputs) {
      transaction.outputs = transaction
        .outputs.sort((o1, o2) => +o1.outPoint!.index - +o2.outPoint!.index)
        .slice(0, 200)
    }

    return {
      status: ResponseCode.Success,
      result: transaction,
    }
  }

  @CatchControllerError
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

/* eslint-disable*/
declare global {
  module Controller {
    type TransactionsMethod = Exclude<keyof typeof TransactionsController, keyof typeof Object>
  }
}
/* eslint-enable */
