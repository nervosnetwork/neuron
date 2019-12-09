import { take } from 'rxjs/operators'
import { ipcMain, IpcMainInvokeEvent } from 'electron'

import env from 'env'
import i18n from 'utils/i18n'
import { showWindow } from './app/show-window'
import { TransactionsController, WalletsController, SyncController, NetworksController, UpdateController, DaoController } from 'controllers'
import { NetworkType, NetworkID, Network } from 'types/network'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { SystemScriptSubject } from 'models/subjects/system-script'
import { MapApiResponse } from 'decorators'
import { ResponseCode } from 'utils/const'
import { TransactionWithoutHash, OutPoint } from 'types/cell-types'

const NODE_DISCONNECTED_CODE = 104

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


  /// Experiment Electron 7 revoke/handle
  public static mount() {
    // App
    handle('load-init-data', async () => {
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
    })

    handle('open-in-window', async (_, { url, title }: { url: string, title: string }) => {
      showWindow(url, title)
    })

    handle('handle-view-error', async (_, error: string) => {
      if (env.isDevMode) {
        console.error(error)
      }
    })

    // Transactions

    handle('get-transaction-list', async (_, params: Controller.Params.TransactionsByKeywords) => {
      return TransactionsController.getAllByKeywords(params)
    })

    handle('get-transaction', async (_, { walletID, hash }: { walletID: string, hash: string }) => {
      return TransactionsController.get(walletID, hash)
    })

    handle('update-transaction-description', async (_, params: { hash: string; description: string }) => {
      return TransactionsController.updateDescription(params)
    })

    handle('show-transaction-details', async (_, hash: string) => {
      showWindow(`${env.mainURL}#/transaction/${hash}`, i18n.t(`messageBox.transaction.title`, { hash }))
    })

    // Dao

    handle('get-dao-data', async (_, params: Controller.Params.GetDaoCellsParams) => {
      return DaoController.getDaoCells(params)
    })

    handle('generate-dao-deposit-tx', async (_, params: { walletID: string, capacity: string, fee: string, feeRate: string }) => {
      return DaoController.generateDepositTx(params)
    })

    handle('generate-dao-deposit-all-tx', async (_, params: { walletID: string, fee: string, feeRate: string }) => {
      return DaoController.generateDepositAllTx(params)
    })

    handle('start-withdraw-from-dao', async (_, params: { walletID: string, outPoint: OutPoint, fee: string, feeRate: string }) => {
      return DaoController.startWithdrawFromDao(params)
    })

    handle('withdraw-from-dao', async (_, params: { walletID: string, depositOutPoint: OutPoint, withdrawingOutPoint: OutPoint, fee: string, feeRate: string }) => {
      return DaoController.withdrawFromDao(params)
    })

    // Networks

    handle('get-all-networks', async () => {
      return NetworksController.getAll()
    })

    handle('create-network', async (_, { name, remote, type = NetworkType.Normal, genesisHash = '0x', chain = 'ckb' }: Network) => {
      return NetworksController.create({ name, remote, type, genesisHash, chain })
    })

    handle('update-network', async (_, { networkID, options }: { networkID: NetworkID, options: Partial<Network> }) => {
      return NetworksController.update(networkID, options)
    })

    handle('get-current-network-id', async () => {
      return NetworksController.currentID()
    })

    handle('set-current-network-id', async (_, id: NetworkID) => {
      return NetworksController.activate(id)
    })

    handle('delete-network', async (_, id: NetworkID) => {
      return NetworksController.delete(id)
    })

    // Updater

    handle('check-for-updates', async () => {
      new UpdateController().checkUpdates()
    })

    handle('download-update', async () => {
      new UpdateController(false).downloadUpdate()
    })

    handle('quit-and-install-update', async () => {
      new UpdateController(false).quitAndInstall()
    })

    // Settings

    handle('clear-cache', async () => {
      return SyncController.clearCache()
    })
  }
}

// Register handler, warp and serialize API response
const handle = (channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => (Promise<void>) | (any)) => {
  ipcMain.handle(channel, async (event, args) => {
    try {
      const res = await listener(event, args)
      return JSON.stringify(res)
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        err.code = NODE_DISCONNECTED_CODE
      }
      const res = {
        status: err.code || ResponseCode.Fail,
        message: typeof err.message === 'string' ? { content: err.message } : err.message,
      }
      return JSON.stringify(res)
    }
  })
}