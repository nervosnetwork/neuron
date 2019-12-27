import { take } from 'rxjs/operators'
import { ipcMain, IpcMainInvokeEvent } from 'electron'

import env from 'env'
import i18n from 'locales/i18n'
import { showWindow } from './app/show-window'
import { NetworkType, Network } from 'models/network'
import { ConnectionStatusSubject } from 'models/subjects/node'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import { ResponseCode } from 'utils/const'

import WalletsController from 'controllers/wallets'
import TransactionsController from 'controllers/transactions'
import DaoController from 'controllers/dao'
import NetworksController from 'controllers/networks'
import UpdateController from 'controllers/update'
import SyncController from 'controllers/sync'
import OutPoint from 'models/chain/out-point'
import { TransactionWithoutHash } from 'models/chain/transaction'

/**
 * @class ApiController
 * @description Handle channel messages from neuron UI renderer process
 */
export default class ApiController {
  private walletsController = new WalletsController()
  private transactionsController = new TransactionsController()
  private daoController = new DaoController()
  private networksController = new NetworksController()

  public async mount() {
    this.registerHandlers()

    this.networksController.start()
  }

  private registerHandlers() {
    const handle = this.handleChannel

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
      ] = await Promise.all([
        networksService.getCurrentID(),
        networksService.getAll(),

        new SyncController().currentBlockNumber()
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
      ])

      const addresses: Controller.Address[] = await (currentWallet
        ? this.walletsController.getAllAddresses(currentWallet.id).then(res => res.result)
        : [])

      const transactions = currentWallet
        ? await this.transactionsController.getAllByKeywords({
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

    // Wallets

    handle('get-all-wallets', async () => {
      return this.walletsController.getAll()
    })

    handle('get-current-wallet', async () => {
      return this.walletsController.getCurrent()
    })

    handle('set-current-wallet', async (_, id: string) => {
      return this.walletsController.activate(id)
    })

    handle('import-mnemonic', async (_, params: { name: string; password: string; mnemonic: string }) => {
      return this.walletsController.importMnemonic(params)
    })

    handle('import-keystore', async (_, params: { name: string; password: string; keystorePath: string }) => {
      return this.walletsController.importKeystore(params)
    })

    handle('create-wallet', async (_, params: { name: string; password: string; mnemonic: string }) => {
      return this.walletsController.create(params)
    })

    handle('update-wallet', async (_, params: { id: string; password: string; name: string; newPassword?: string }) => {
      return this.walletsController.update(params)
    })

    handle('delete-wallet', async (_, { id = '', password = '' }) => {
      return this.walletsController.delete({ id, password })
    })

    handle('backup-wallet', async (_, { id = '', password = '' }) => {
      return this.walletsController.backup({ id, password })
    })

    handle('get-all-addresses', async (_, id: string) => {
      return this.walletsController.getAllAddresses(id)
    })

    handle('update-address-description', async (_, params: { walletID: string, address: string, description: string }) => {
      return this.walletsController.updateAddressDescription(params)
    })

    handle('request-password', async (_, { walletID, action }: { walletID: string, action: 'delete-wallet' | 'backup-wallet' }) => {
      this.walletsController.requestPassword(walletID, action)
    })

    handle('send-tx', async (_, params: { walletID: string, tx: TransactionWithoutHash, password: string, description?: string }) => {
      return this.walletsController.sendTx(params)
    })

    handle('generate-tx', async (_, params: { walletID: string, items: { address: string, capacity: string }[], fee: string, feeRate: string }) => {
      return this.walletsController.generateTx(params)
    })

    handle('generate-send-all-tx', async (_, params: { walletID: string, items: { address: string, capacity: string }[], fee: string, feeRate: string }) => {
      return this.walletsController.generateSendingAllTx(params)
    })

    handle('generate-mnemonic', async () => {
      return this.walletsController.generateMnemonic()
    })

    handle('validate-mnemonic', async (_, mnemonic: string) => {
      return this.walletsController.validateMnemonic(mnemonic)
    })

    // Transactions

    handle('get-transaction-list', async (_, params: Controller.Params.TransactionsByKeywords) => {
      return this.transactionsController.getAllByKeywords(params)
    })

    handle('get-transaction', async (_, { walletID, hash }: { walletID: string, hash: string }) => {
      return this.transactionsController.get(walletID, hash)
    })

    handle('update-transaction-description', async (_, params: { hash: string; description: string }) => {
      return this.transactionsController.updateDescription(params)
    })

    handle('show-transaction-details', async (_, hash: string) => {
      showWindow(`#/transaction/${hash}`, i18n.t(`messageBox.transaction.title`, { hash }))
    })

    // Dao

    handle('get-dao-data', async (_, params: Controller.Params.GetDaoCellsParams) => {
      return this.daoController.getDaoCells(params)
    })

    handle('generate-dao-deposit-tx', async (_, params: { walletID: string, capacity: string, fee: string, feeRate: string }) => {
      return this.daoController.generateDepositTx(params)
    })

    handle('generate-dao-deposit-all-tx', async (_, params: { walletID: string, fee: string, feeRate: string }) => {
      return this.daoController.generateDepositAllTx(params)
    })

    handle('start-withdraw-from-dao', async (_, params: { walletID: string, outPoint: OutPoint, fee: string, feeRate: string }) => {
      return this.daoController.startWithdrawFromDao(params)
    })

    handle('withdraw-from-dao', async (_, params: { walletID: string, depositOutPoint: OutPoint, withdrawingOutPoint: OutPoint, fee: string, feeRate: string }) => {
      return this.daoController.withdrawFromDao(params)
    })

    // Networks

    handle('get-all-networks', async () => {
      return this.networksController.getAll()
    })

    handle('create-network', async (_, { name, remote, type = NetworkType.Normal }: Network) => {
      return this.networksController.create({ name, remote, type, genesisHash: '0x', chain: 'ckb', id: '' })
    })

    handle('update-network', async (_, { networkID, options }: { networkID: string, options: Partial<Network> }) => {
      return this.networksController.update(networkID, options)
    })

    handle('get-current-network-id', async () => {
      return this.networksController.currentID()
    })

    handle('set-current-network-id', async (_, id: string) => {
      return this.networksController.activate(id)
    })

    handle('delete-network', async (_, id: string) => {
      return this.networksController.delete(id)
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
      return new SyncController().clearCache()
    })
  }

  // Register handler, warp and serialize API response
  static NODE_DISCONNECTED_CODE = 104
  private handleChannel(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => (Promise<void>) | (any)) {
    ipcMain.handle(channel, async (event, args) => {
      try {
        const res = await listener(event, args)
        return res
      } catch (err) {
        if (err.code === 'ECONNREFUSED') {
          err.code = ApiController.NODE_DISCONNECTED_CODE
        }
        const res = {
          status: err.code || ResponseCode.Fail,
          message: typeof err.message === 'string' ? { content: err.message } : err.message,
        }
        return res
      }
    })
  }
}
