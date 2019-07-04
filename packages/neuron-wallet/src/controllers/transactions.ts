import { Transaction } from '../types/cell-types'
import TransactionsService, { PaginationResult, TransactionsByLockHashesParam } from '../services/transactions'

import AddressService from '../services/addresses'
import WalletsService from '../services/wallets'

import { Controller as ControllerDecorator, CatchControllerError } from '../decorators'
import { Channel, ResponseCode } from '../utils/const'
import { TransactionNotFound, CurrentWalletNotSet, ServiceHasNoResponse } from '../exceptions'
import LockUtils from '../models/lock-utils'

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

    if (!transactions) throw new ServiceHasNoResponse('Transactions')

    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
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
      if (!wallet) throw new CurrentWalletNotSet()
      searchAddresses = (await AddressService.allAddressesByWalletId(wallet.id)).map(addr => addr.address)
    }

    const transactions = await TransactionsService.getAllByAddresses({ pageNo, pageSize, addresses: searchAddresses })

    if (!transactions) throw new ServiceHasNoResponse('Transactions')
    return {
      status: ResponseCode.Success,
      result: { ...params, ...transactions },
    }
  }

  @CatchControllerError
  public static async get(hash: string): Promise<Controller.Response<Transaction>> {
    const transaction = await TransactionsService.get(hash)

    if (!transaction) throw new TransactionNotFound(hash)

    const wallet = WalletsService.getInstance().getCurrent()
    if (!wallet) throw new CurrentWalletNotSet()
    const addresses: string[] = (await AddressService.allAddressesByWalletId(wallet.id)).map(addr => addr.address)
    const lockHashes: string[] = await Promise.all(
      addresses.map(async addr => {
        return LockUtils.addressToLockHash(addr)
      })
    )

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
