import { take } from 'rxjs/operators'
import { ipcMain } from 'electron'

import env from 'env'
import i18n from 'utils/i18n'
import { showWindow } from './app/show-window'
import { TransactionsController, WalletsController, SyncController, NetworksController, UpdateController } from 'controllers'
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
  public static async requestPassword({ walletID, action }: { walletID: string, action: 'delete-wallet' | 'backup-wallet' }) {
    WalletsController.requestPassword(walletID, action)
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
  public static async generateSendingAllTx(params: {
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    fee: string
    feeRate: string
  }) {
    return WalletsController.generateSendingAllTx(params)
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

  @MapApiResponse
  public static async deleteNetwork(id: NetworkID) {
    return NetworksController.delete(id)
  }


  /// Experiment Electron 7 revoke/handle
  public static mount() {
    // App

    ipcMain.handle('load-init-data', async () => {
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

      return mapResponse({ status: ResponseCode.Success, result: initState })
    })

    ipcMain.handle('open-in-window', async (_, { url, title }: { url: string, title: string }) => {
      showWindow(url, title)
    })

    ipcMain.handle('handle-view-error', async (_, error: string) => {
      if (env.isDevMode) {
        console.error(error)
      }
    })

    // Transactions

    ipcMain.handle('get-transaction-list', async (_, params: Controller.Params.TransactionsByKeywords) => {
      return mapResponse(await TransactionsController.getAllByKeywords(params))
    })

    ipcMain.handle('get-transaction', async (_, { walletID, hash }: { walletID: string, hash: string }) => {
      return mapResponse(await TransactionsController.get(walletID, hash))
    })

    ipcMain.handle('update-transaction-description', async (_, params: { hash: string; description: string }) => {
      return mapResponse(await TransactionsController.updateDescription(params))
    })

    ipcMain.handle('show-transaction-details', async (_, hash: string) => {
      showWindow(`${env.mainURL}#/transaction/${hash}`, i18n.t(`messageBox.transaction.title`, { hash }))
    })

    // Dao

    ipcMain.handle('get-dao-data', async (_, params: Controller.Params.GetDaoCellsParams) => {
      return mapResponse(await DaoController.getDaoCells(params))
    })

    ipcMain.handle('generate-dao-deposit-tx', async (_, params: { walletID: string, capacity: string, fee: string, feeRate: string }) => {
      return mapResponse(await DaoController.generateDepositTx(params))
    })

    ipcMain.handle('generate-dao-deposit-all-tx', async (_, params: { walletID: string, fee: string, feeRate: string }) => {
      return mapResponse(await DaoController.generateDepositAllTx(params))
    })

    ipcMain.handle('start-withdraw-from-dao', async (_, params: { walletID: string, outPoint: OutPoint, fee: string, feeRate: string }) => {
      return mapResponse(await DaoController.startWithdrawFromDao(params))
    })

    ipcMain.handle('withdraw-from-dao', async (_, params: { walletID: string, depositOutPoint: OutPoint, withdrawingOutPoint: OutPoint, fee: string, feeRate: string }) => {
      return mapResponse(await DaoController.withdrawFromDao(params))
    })

    // Settings

    ipcMain.handle('check-for-updates', async () => {
      new UpdateController().checkUpdates()
    })

    ipcMain.handle('download-update', async () => {
      new UpdateController(false).downloadUpdate()
    })

    ipcMain.handle('quit-and-install-update', async () => {
      new UpdateController(false).quitAndInstall()
    })

    ipcMain.handle('clear-cache', async () => {
      return SyncController.clearCache()
    })
  }
}

const mapResponse = (res: any): string => {
  return JSON.stringify(res)
}