import { take } from 'rxjs/operators'
import { ipcMain, IpcMainInvokeEvent, dialog, app, OpenDialogSyncOptions, MenuItemConstructorOptions, MenuItem, Menu, screen, BrowserWindow } from 'electron'
import { t } from 'i18next'
import env from 'env'
import { showWindow } from './app/show-window'
import { NetworkType, Network } from 'models/network'
import { ConnectionStatusSubject } from 'models/subjects/node'
import NetworksService from 'services/networks'
import WalletsService from 'services/wallets'
import SettingsService, { Locale } from 'services/settings'
import { ResponseCode, SETTINGS_WINDOW_TITLE } from 'utils/const'

import WalletsController from 'controllers/wallets'
import TransactionsController from 'controllers/transactions'
import DaoController from 'controllers/dao'
import NetworksController from 'controllers/networks'
import UpdateController from 'controllers/update'
import SyncController from 'controllers/sync'
import Transaction from 'models/chain/transaction'
import OutPoint from 'models/chain/out-point'
import SignMessageController from 'controllers/sign-message'
import CustomizedAssetsController from './customized-assets'
import SystemScriptInfo from 'models/system-script-info'
import logger from 'utils/logger'
import AssetAccountController from './asset-account'
import { GenerateCreateAssetAccountTxParams, SendCreateAssetAccountTxParams, UpdateAssetAccountParams } from './asset-account'
import AnyoneCanPayController from './anyone-can-pay'
import { GenerateAnyoneCanPayTxParams, GenerateAnyoneCanPayAllTxParams, SendAnyoneCanPayTxParams } from './anyone-can-pay'

// Handle channel messages from neuron react UI renderer process and user actions.
export default class ApiController {
  private walletsController = new WalletsController()
  private transactionsController = new TransactionsController()
  private daoController = new DaoController()
  private networksController = new NetworksController()
  private signAndVerifyController = new SignMessageController()
  private customizedAssetsController = new CustomizedAssetsController()
  private assetAccountController = new AssetAccountController()
  private anyoneCanPayController = new AnyoneCanPayController()

  public async mount() {
    this.registerHandlers()

    await this.networksController.start()
  }

  public runCommand(command: string, params: string) {
    if (command === 'export-xpubkey') {
      this.walletsController.exportXPubkey(params)
    }

    if (command === 'import-xpubkey') {
      this.walletsController.importXPubkey().catch(error => {
        dialog.showMessageBox({ type: 'error', buttons: [], message: error.message })
      })
    }

    if (command === 'delete-wallet' || command === 'backup-wallet') {
      // params: walletID
      this.walletsController.requestPassword(params, command)
    }
  }

  private registerHandlers() {
    const handle = this.handleChannel

    // sync messages
    ipcMain.on('get-locale', e => {
      e.returnValue = SettingsService.getInstance().locale
    })

    ipcMain.on('get-version', e => {
      e.returnValue = app.getVersion()
    })

    ipcMain.on('get-platform', e => {
      e.returnValue = process.platform
    })

    ipcMain.on('get-win-id', e => {
      e.returnValue = BrowserWindow.fromWebContents(e.sender)?.id
    })

    // App
    handle('get-system-codehash', async () => {
      return {
        status: ResponseCode.Success,
        result: SystemScriptInfo.SECP_CODE_HASH
      }
    })

    handle('show-error-message', async (_, { title = '',  content = '' } ) => {
      dialog.showErrorBox(title, content)
    })

    handle('show-open-dialog', async (_, params: OpenDialogSyncOptions) => {
      const result = await dialog.showOpenDialog(params)
      return {
        status: ResponseCode.Success,
        result
      }
    })

    handle('show-open-dialog-modal', async (e, params: OpenDialogSyncOptions) => {
      const win = BrowserWindow.fromWebContents(e.sender)!
      const result = await dialog.showOpenDialog(win, params)
      return {
        status: ResponseCode.Success,
        result
      }
    })

    handle('open-context-menu', async (_, params: Array<MenuItemConstructorOptions | MenuItem>) => {
      Menu.buildFromTemplate(params).popup()
    })

    handle('get-all-displays-size', async () => {
      const result = screen.getAllDisplays().map(d => d.size)
      return {
        status: ResponseCode.Success,
        result
      }
    })

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
        ? await this.transactionsController.getAll({
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

    handle('set-locale', async (_, locale: Locale) => {
      return SettingsService.getInstance().locale = locale
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

    handle('export-xpubkey', async (_, id: string) => {
      return this.walletsController.exportXPubkey(id)
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

    handle('send-tx', async (_, params: { walletID: string, tx: Transaction, password: string, description?: string }) => {
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
      return this.transactionsController.getAll(params)
    })

    handle('get-transaction', async (_, { walletID, hash }: { walletID: string, hash: string }) => {
      return this.transactionsController.get(walletID, hash)
    })

    handle('update-transaction-description', async (_, params: { walletID: string; hash: string; description: string }) => {
      return this.transactionsController.updateDescription(params)
    })

    handle('show-transaction-details', async (_, hash: string) => {
      showWindow(`#/transaction/${hash}`, t(`messageBox.transaction.title`, { hash }), {
        height: 750
      })
    })

    handle('export-transactions', async (_, params: { walletID: string }) => {
      return this.transactionsController.exportTransactions(params)
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

    // Customized Asset
    handle('get-customized-asset-cells', async (_, params: Controller.Params.GetCustomizedAssetCellsParams) => {
      return this.customizedAssetsController.getCustomizedAssetCells(params)
    })

    handle('generate-withdraw-customized-cell-tx', async (_, params: Controller.Params.GenerateWithdrawCustomizedCellTxParams) => {
      return this.customizedAssetsController.generateWithdrawCustomizedCellTx(params)
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

    handle('show-settings', (_, params: Controller.Params.ShowSettings) => {
      showWindow(`#/settings/${params.tab}`, t(SETTINGS_WINDOW_TITLE), { width: 900 })
    })

    handle('clear-cache', async (_, params: {resetIndexerData: boolean } | null) => {
      return new SyncController().clearCache(params?.resetIndexerData)
    })

    // Sign and Verify
    handle('sign-message', async (_, params: Controller.Params.SignParams) => {
      return this.signAndVerifyController.sign(params)
    })

    handle('verify-signature', async (_, params: Controller.Params.VerifyParams) => {
      return this.signAndVerifyController.verify(params)
    })

    // sUDT

    handle('get-anyone-can-pay-script', () => {
      return this.anyoneCanPayController.getScript()
    })

    handle('get-token-info-list', () => {
      return this.assetAccountController.getTokenInfoList()
    })

    handle('generate-create-asset-account-tx', async (_, params: GenerateCreateAssetAccountTxParams) => {
      return this.assetAccountController.generateCreateTx(params)
    })

    handle('send-create-asset-account-tx', async (_, params: SendCreateAssetAccountTxParams) => {
      return this.assetAccountController.sendCreateTx(params)
    })

    handle('update-asset-account', async (_, params: UpdateAssetAccountParams) => {
      return this.assetAccountController.update(params)
    })

    handle('asset-accounts', async (_, params: { walletID: string }) => {
      return this.assetAccountController.getAll(params)
    })

    handle("get-asset-account", async (_, params: { walletID: string, id: number }) => {
      return this.assetAccountController.getAccount(params)
    })

    handle('generate-send-to-anyone-can-pay-tx', async (_, params: GenerateAnyoneCanPayTxParams) => {
      return this.anyoneCanPayController.generateTx(params)
    })

    handle('generate-send-all-to-anyone-can-pay-tx', async (_, params: GenerateAnyoneCanPayAllTxParams) => {
      return this.anyoneCanPayController.generateSendAllTx(params)
    })

    handle('send-to-anyone-can-pay', async (_, params: SendAnyoneCanPayTxParams) => {
      return this.anyoneCanPayController.sendTx(params)
    })
  }

  // Register handler, warp and serialize API response
  static NODE_DISCONNECTED_CODE = 104
  private handleChannel(channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => (Promise<void>) | (any)) {
    ipcMain.handle(channel, async (event, args) => {
      try {
        const res = await listener(event, args)
        // All objects, array, class instance need to be serialized before sent to the IPC
        if (typeof res === 'object') {
          return JSON.parse(JSON.stringify(res))
        }
        return res
      } catch (err) {
        logger.warn(`channel handling error: ${err}`)

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
