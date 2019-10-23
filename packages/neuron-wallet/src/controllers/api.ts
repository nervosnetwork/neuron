import { take } from 'rxjs/operators'

import env from 'env'
import i18n from 'utils/i18n'
import { popContextMenu } from './app/menu'
import { showWindow } from './app/show-window'
import {
  TransactionsController,
  WalletsController,
  SyncInfoController,
  SkipDataAndTypeController,
  NetworksController
} from 'controllers'
import { NetworkType, NetworkID, Network } from 'types/network'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import SkipDataAndType from 'services/settings/skip-data-and-type'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { SystemScriptSubject } from 'models/subjects/system-script'
import { CatchControllerError } from 'decorators/errors'
import { ResponseCode } from 'utils/const'
import { TransactionWithoutHash } from 'types/cell-types'

/**
 * @class ApiController
 * @description Handle messages from neuron UI channels
 */
export default class ApiController {
  // App
  public static loadInitData = async () => {
    const walletsService = WalletsService.getInstance()
    const networksService = NetworksService.getInstance()
    const [
      currentWallet = null,
      wallets = [],
      currentNetworkID = '',
      networks = [],
      syncedBlockNumber = '0',
      connectionStatus = false,
      codeHash = '',
    ] = await Promise.all([
      walletsService.getCurrent(),
      walletsService.getAll(),
      networksService.getCurrentID(),
      networksService.getAll(),

      SyncInfoController.currentBlockNumber()
        .then(res => {
          if (res.status) {
            return res.result.currentBlockNumber
          }
          return '0'
        })
        .catch(() => '0'),
      new Promise(resolve => {
        ConnectionStatusSubject.pipe(take(1)).subscribe(
          status => {
            resolve(status)
          },
          () => {
            resolve(false)
          },
        )
      }),
      new Promise(resolve => {
        SystemScriptSubject.pipe(take(1)).subscribe(({ codeHash: currentCodeHash }) => resolve(currentCodeHash))
      }),
    ])

    const minerAddresses = await Promise.all(
      wallets.map(({ id }) =>
        WalletsController.getAllAddresses(id).then(addrRes => {
          if (addrRes.result) {
            const minerAddr = addrRes.result.find(addr => addr.type === 0 && addr.index === 0)
            if (minerAddr) {
              return {
                address: minerAddr.address,
                identifier: minerAddr.identifier,
              }
            }
          }
          return undefined
        }),
      ),
    )
    const addresses: Controller.Address[] = await (currentWallet
      ? WalletsController.getAllAddresses(currentWallet.id).then(res => res.result)
      : [])

    const transactions = currentWallet
      ? await TransactionsController.getAllByKeywords({
          pageNo: 1,
          pageSize: 15,
          keywords: '',
          walletID: currentWallet.id,
        }).then(res => res.result)
      : []

    const skipDataAndType = SkipDataAndType.getInstance().get()

    const initState = {
      currentWallet,
      wallets: [...wallets.map(({ name, id }, idx: number) => ({ id, name, minerAddress: minerAddresses[idx] }))],
      currentNetworkID,
      networks,
      addresses,
      transactions,
      syncedBlockNumber,
      connectionStatus,
      codeHash,
      skipDataAndType,
    }

    return { status: ResponseCode.Success, result: initState }
  }

  public static handleViewError = (error: string) => {
    if (env.isDevMode) {
      console.error(error)
    }
  }

  public static async contextMenu(params: { type: string; id: string }) {
    return popContextMenu(params)
  }

  // Wallets

  @CatchControllerError
  public static async getAllWallets() {
    return WalletsController.getAll()
  }

  @CatchControllerError
  public static async getCurrentWallet() {
    return WalletsController.getCurrent()
  }

  @CatchControllerError
  public static async importMnemonic(params: { name: string, password: string, mnemonic: string }) {
    return WalletsController.importMnemonic(params)
  }

  @CatchControllerError
  public static async importKeystore(params: { name: string, password: string, keystorePath: string }) {
    return WalletsController.importKeystore(params)
  }

  @CatchControllerError
  public static async createWallet(params: { name: string, password: string, mnemonic: string }) {
    return WalletsController.create(params)
  }

  @CatchControllerError
  public static async updateWallet(params: { id: string, password: string, name: string, newPassword?: string }) {
    WalletsController.update(params)
  }

  @CatchControllerError
  public static async deleteWallet({ id = '', password = '' }) {
    return WalletsController.delete({ id, password })
  }

  @CatchControllerError
  public static async backupWallet({ id = '', password = '' }) {
    return WalletsController.backup({ id, password })
  }

  @CatchControllerError
  public static async setCurrentWallet(id: string) {
    return WalletsController.activate(id)
  }

  @CatchControllerError
  public static async getAddressesByWalletID(id: string) {
    return WalletsController.getAllAddresses(id)
  }

  @CatchControllerError
  public static async sendCapacity(params: {
    id: string
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    password: string
    fee: string
    description?: string
  }) {
    return WalletsController.sendCapacity(params)
  }

  @CatchControllerError
  public static async sendTx(params: {
    walletID: string
    tx: TransactionWithoutHash,
    password: string
    description?: string
  }) {
    return WalletsController.sendTx(params)
  }

  @CatchControllerError
  public static async generateTx(params: {
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    fee: string
    feeRate: string
  }) {
    return WalletsController.generateTx(params)
  }

  @CatchControllerError
  public static async calculateFee(params: {
    tx: TransactionWithoutHash
  }) {
    return WalletsController.calculateFee(params)
  }

  @CatchControllerError
  public static async computeCycles(params: { walletID: string; capacities: string }) {
    return WalletsController.computeCycles(params)
  }

  @CatchControllerError
  public static async updateAddressDescription(params: {
    walletID: string
    address: string
    description: string
  }) {
    return WalletsController.updateAddressDescription(params)
  }

  // Networks

  @CatchControllerError
  public static async getAllNetworks() {
    return NetworksController.getAll()
  }

  @CatchControllerError
  public static async createNetwork({ name, remote, type = NetworkType.Normal, chain = 'ckb' }: Network) {
    return NetworksController.create({ name, remote, type, chain })
  }

  @CatchControllerError
  public static async updateNetwork(id: NetworkID, options: Partial<Network>) {
    return NetworksController.update(id, options)
  }

  @CatchControllerError
  public static async getCurrentNetworkID() {
    return NetworksController.currentID()
  }

  @CatchControllerError
  public static async setCurrentNetowrk(id: NetworkID) {
    return NetworksController.activate(id)
  }

  // Transactions

  @CatchControllerError
  public static async getTransactionList(
    params: Controller.Params.TransactionsByKeywords,
  ) {
    return TransactionsController.getAllByKeywords(params)
  }

  @CatchControllerError
  public static async getTransaction(walletID: string, hash: string) {
    return TransactionsController.get(walletID, hash)
  }

  @CatchControllerError
  public static async updateTransactionDescription(params: { hash: string; description: string }) {
    return TransactionsController.updateDescription(params)
  }

  public static async showTransactionDetails(hash: string) {
    showWindow(`${env.mainURL}#/transaction/${hash}`, i18n.t(`messageBox.transaction.title`, { hash }))
  }

  // Misc

  @CatchControllerError
  public static async updateSkipDataAndType(skip: boolean) {
    return SkipDataAndTypeController.update(skip)
  }
}
