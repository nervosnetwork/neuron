import { take } from 'rxjs/operators'

import env from 'env'
import i18n from 'utils/i18n'
import { popContextMenu } from './app/menu'
import { showWindow } from './app/show-window'
import { TransactionsController, WalletsController, SyncController, NetworksController } from 'controllers'
import { NetworkType, NetworkID, Network } from 'types/network'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { SystemScriptSubject } from 'models/subjects/system-script'
import { MapApiResponse } from 'decorators'
import { ResponseCode } from 'utils/const'
import { TransactionWithoutHash, OutPoint } from 'types/cell-types'
import DaoController from './dao'

/**
 * @class ApiController
 * @description Handle messages from neuron UI channels
 */
export default class ApiController {
  // App

  @MapApiResponse
  public static async loadInitData() {
    const walletsService = WalletsService.getInstance()
    const networksService = NetworksService.getInstance()

    const currentWallet = walletsService.getCurrent()
    const wallets = walletsService.getAll()

    const [
      currentNetworkID = '',
      networks = [],
      syncedBlockNumber = '0',
      connectionStatus = false,
      codeHash = '',
    ] = await Promise.all([
      networksService.getCurrentID(),
      networksService.getAll(),

      SyncController.currentBlockNumber()
        .then(res => {
          if (res.status) {
            return res.result.currentBlockNumber
          }
          return '0'
        })
        .catch(() => '0'),

      new Promise(resolve => {
        ConnectionStatusSubject.pipe(take(1)).subscribe(
          status => { resolve(status) },
          () => { resolve(false) },
          () => { resolve(false) }
        )
      }),

      new Promise(resolve => {
        SystemScriptSubject.pipe(take(1)).subscribe(
          ({ codeHash: currentCodeHash }) => resolve(currentCodeHash),
          () => { resolve('') },
          () => { resolve('') }
        )
      }),
    ])

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

    const initState = {
      currentWallet: currentWallet || null,
      wallets: wallets,
      currentNetworkID,
      networks,
      addresses,
      transactions,
      syncedBlockNumber,
      connectionStatus,
      codeHash,
    }

    return { status: ResponseCode.Success, result: initState }
  }

  @MapApiResponse
  public static handleViewError(error: string) {
    if (env.isDevMode) {
      console.error(error)
    }
  }

  @MapApiResponse
  public static async contextMenu(params: { type: string; id: string }) {
    return popContextMenu(params)
  }

  // Wallets

  @MapApiResponse
  public static async getAllWallets() {
    return WalletsController.getAll()
  }

  @MapApiResponse
  public static async getCurrentWallet() {
    return WalletsController.getCurrent()
  }

  @MapApiResponse
  public static async importMnemonic(params: { name: string; password: string; mnemonic: string }) {
    return WalletsController.importMnemonic(params)
  }

  @MapApiResponse
  public static async importKeystore(params: { name: string; password: string; keystorePath: string }) {
    return WalletsController.importKeystore(params)
  }

  @MapApiResponse
  public static async createWallet(params: { name: string; password: string; mnemonic: string }) {
    return WalletsController.create(params)
  }

  @MapApiResponse
  public static async updateWallet(params: { id: string; password: string; name: string; newPassword?: string }) {
    return WalletsController.update(params)
  }

  @MapApiResponse
  public static async deleteWallet({ id = '', password = '' }) {
    return WalletsController.delete({ id, password })
  }

  @MapApiResponse
  public static async backupWallet({ id = '', password = '' }) {
    return WalletsController.backup({ id, password })
  }

  @MapApiResponse
  public static async setCurrentWallet(id: string) {
    return WalletsController.activate(id)
  }

  @MapApiResponse
  public static async getAddressesByWalletID(id: string) {
    return WalletsController.getAllAddresses(id)
  }

  @MapApiResponse
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

  @MapApiResponse
  public static async sendTx(params: {
    walletID: string
    tx: TransactionWithoutHash
    password: string
    description?: string
  }) {
    return WalletsController.sendTx(params)
  }

  @MapApiResponse
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

  @MapApiResponse
  public static async generateDepositTx(params: {
    walletID: string,
    capacity: string,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    return WalletsController.generateDepositTx(params)
  }

  @MapApiResponse
  public static async startWithdrawFromDao(params: {
    walletID: string,
    outPoint: OutPoint,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    return WalletsController.startWithdrawFromDao(params)
  }

  @MapApiResponse
  public static async withdrawFromDao(params: {
    walletID: string,
    depositOutPoint: OutPoint,
    withdrawingOutPoint: OutPoint,
    fee: string,
    feeRate: string,
  }): Promise<Controller.Response<TransactionWithoutHash>> {
    return WalletsController.withdrawFromDao(params)
  }

  @MapApiResponse
  public static async computeCycles(params: { walletID: string; capacities: string }) {
    return WalletsController.computeCycles(params)
  }

  @MapApiResponse
  public static async updateAddressDescription(params: {
    walletID: string
    address: string
    description: string
  }) {
    return WalletsController.updateAddressDescription(params)
  }

  // Networks

  @MapApiResponse
  public static async getAllNetworks() {
    return NetworksController.getAll()
  }

  @MapApiResponse
  public static async createNetwork({ name, remote, type = NetworkType.Normal, genesisHash = '0x', chain = 'ckb' }: Network) {
    return NetworksController.create({ name, remote, type, genesisHash, chain })
  }

  @MapApiResponse
  public static async updateNetwork(id: NetworkID, options: Partial<Network>) {
    return NetworksController.update(id, options)
  }

  @MapApiResponse
  public static async getCurrentNetworkID() {
    return NetworksController.currentID()
  }

  @MapApiResponse
  public static async setCurrentNetowrk(id: NetworkID) {
    return NetworksController.activate(id)
  }

  // Transactions

  @MapApiResponse
  public static async getTransactionList(params: Controller.Params.TransactionsByKeywords) {
    return TransactionsController.getAllByKeywords(params)
  }

  @MapApiResponse
  public static async getTransaction(walletID: string, hash: string) {
    return TransactionsController.get(walletID, hash)
  }

  @MapApiResponse
  public static async updateTransactionDescription(params: { hash: string; description: string }) {
    return TransactionsController.updateDescription(params)
  }

  @MapApiResponse
  public static async showTransactionDetails(hash: string) {
    showWindow(`${env.mainURL}#/transaction/${hash}`, i18n.t(`messageBox.transaction.title`, { hash }))
  }

  // Dao
  @MapApiResponse
  public static async getDaoCells(
    params: Controller.Params.GetDaoCellsParams
  ) {
    return DaoController.getDaoCells(params)
  }

  // settings
  @MapApiResponse
  public static async clearCellCache() {
    await SyncController.stopSyncing()
    // TODO: remove cache
    return SyncController.startSyncing()
  }
}
