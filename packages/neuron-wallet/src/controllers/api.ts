import { take } from 'rxjs/operators'
import {
  shell,
  ipcMain,
  IpcMainInvokeEvent,
  dialog,
  app,
  OpenDialogSyncOptions,
  MenuItemConstructorOptions,
  MenuItem,
  Menu,
  screen,
  BrowserWindow,
  nativeTheme,
} from 'electron'
import { t } from 'i18next'
import path from 'path'
import fs from 'fs'
import env from '../env'
import { showWindow } from './app/show-window'
import CommonUtils from '../utils/common'
import { NetworkType, Network } from '../models/network'
import { ConnectionStatusSubject } from '../models/subjects/node'
import NetworksService from '../services/networks'
import WalletsService from '../services/wallets'
import SettingsService, { Locale } from '../services/settings'
import { ResponseCode } from '../utils/const'
import { clean as cleanChain } from '../database/chain'
import WalletsController from '../controllers/wallets'
import TransactionsController from '../controllers/transactions'
import DaoController from '../controllers/dao'
import NetworksController from '../controllers/networks'
import UpdateController from '../controllers/update'
import MultisigController from '../controllers/multisig'
import Transaction from '../models/chain/transaction'
import OutPoint from '../models/chain/out-point'
import SignMessageController from '../controllers/sign-message'
import CustomizedAssetsController from './customized-assets'
import SystemScriptInfo from '../models/system-script-info'
import logger from '../utils/logger'
import AssetAccountController, { GenerateWithdrawChequeTxParams } from './asset-account'
import {
  GenerateCreateAssetAccountTxParams,
  SendCreateAssetAccountTxParams,
  UpdateAssetAccountParams,
  MigrateACPParams,
  GenerateCreateChequeTxParams,
  GenerateClaimChequeTxParams
} from './asset-account'
import AnyoneCanPayController from './anyone-can-pay'
import { GenerateAnyoneCanPayTxParams, SendAnyoneCanPayTxParams } from './anyone-can-pay'
import { DeviceInfo, ExtendedPublicKey } from '../services/hardware/common'
import HardwareController from './hardware'
import OfflineSignController from './offline-sign'
import SUDTController from '../controllers/sudt'
import SyncedBlockNumber from '../models/synced-block-number'
import IndexerService from '../services/indexer'
import MultisigConfigModel from '../models/multisig-config'
import startMonitor, { stopMonitor } from '../services/monitor'
import { migrateCkbData } from '../services/ckb-runner'
import NodeService from '../services/node'
import SyncProgressService from '../services/sync-progress'

export type Command = 'export-xpubkey' | 'import-xpubkey' | 'delete-wallet' | 'backup-wallet' | 'migrate-acp'
// Handle channel messages from renderer process and user actions.
export default class ApiController {
  #walletsController = new WalletsController()
  #transactionsController = new TransactionsController()
  #daoController = new DaoController()
  #networksController = new NetworksController()
  #signAndVerifyController = new SignMessageController()
  #customizedAssetsController = new CustomizedAssetsController()
  #assetAccountController = new AssetAccountController()
  #anyoneCanPayController = new AnyoneCanPayController()
  #hardwareController = new HardwareController()
  #offlineSignController = new OfflineSignController()
  #sudtController = new SUDTController()
  #multisigController = new MultisigController()

  public async mount() {
    this.#registerHandlers()

    await this.#networksController.start()

    nativeTheme.themeSource = SettingsService.getInstance().themeSource
  }

  public runCommand(command: Command, params: string) {
    switch (command) {
      case 'export-xpubkey': {
        // export xpubkey with wallet id
        this.#walletsController.exportXPubkey(params)
        break
      }
      case 'import-xpubkey': {
        this.#walletsController.importXPubkey().catch(error => {
          dialog.showMessageBox({ type: 'error', buttons: [], message: error.message })
        })
        break
      }
      case 'delete-wallet':
      case 'backup-wallet': {
        // delete/backup wallet with wallet id
        this.#walletsController.requestPassword(params, command)
        break
      }
      case 'migrate-acp': {
        this.#assetAccountController.showACPMigrationDialog(false)
        break
      }
      default: {
        logger.error(`API Controller:\treceive invalid command "${command}" with params "${params}"`)
      }
    }
  }

  #registerHandlers = () => {
    const handle = this.#handleChannel

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
        result: SystemScriptInfo.SECP_CODE_HASH,
      }
    })

    handle('show-error-message', async (_, { title = '', content = '' }) => {
      dialog.showErrorBox(title, content)
    })

    handle('show-open-dialog', async (_, params: OpenDialogSyncOptions) => {
      const result = await dialog.showOpenDialog(params)
      return {
        status: ResponseCode.Success,
        result,
      }
    })

    handle('show-open-dialog-modal', async (e, params: OpenDialogSyncOptions) => {
      const win = BrowserWindow.fromWebContents(e.sender)!
      const result = await dialog.showOpenDialog(win, params)
      return {
        status: ResponseCode.Success,
        result,
      }
    })

    handle('open-context-menu', async (_, params: Array<MenuItemConstructorOptions | MenuItem>) => {
      Menu.buildFromTemplate(params).popup()
    })

    handle('get-all-displays-size', async () => {
      const result = screen.getAllDisplays().map(d => d.size)
      return {
        status: ResponseCode.Success,
        result,
      }
    })

    handle('load-init-data', async () => {
      const walletsService = WalletsService.getInstance()
      const networksService = NetworksService.getInstance()

      const currentWallet = this.#walletsController.getCurrent().result
      const wallets = walletsService.getAll()

      const [currentNetworkID = '', networks = [], syncedBlockNumber = '0', connectionStatus = false] =
        await Promise.all([
          networksService.getCurrentID(),
          networksService.getAll(),
          new SyncedBlockNumber()
            .getNextBlock()
            .then(blockNumber => blockNumber.toString())
            .catch(() => '0'),
          new Promise(resolve => {
            ConnectionStatusSubject.pipe(take(1)).subscribe(
              status => {
                resolve(status)
              },
              () => {
                resolve(false)
              },
              () => {
                resolve(false)
              }
            )
          }),
        ])

      const addresses: Controller.Address[] = await (currentWallet
        ? this.#walletsController.getAllAddresses(currentWallet.id).then(res => res.result)
        : [])

      const transactions = currentWallet
        ? await this.#transactionsController
            .getAll({
              pageNo: 1,
              pageSize: 15,
              keywords: '',
              walletID: currentWallet.id,
            })
            .then(res => res.result)
        : []

      const initState = {
        currentWallet: currentWallet || null,
        wallets: wallets,
        currentNetworkID,
        networks,
        addresses,
        transactions,
        syncedBlockNumber,
        connectionStatus
      }

      return { status: ResponseCode.Success, result: initState }
    })

    handle('open-in-window', async (_, { url, title }: { url: string; title: string }) => {
      showWindow(url, title)
    })

    handle('request-open-in-explorer', (_, { key, type }: { key: string; type: 'transaction' }) => {
      if (type !== 'transaction' || !key) {
        return
      }
      dialog
        .showMessageBox({
          type: 'question',
          title: t(`open-in-explorer.title`),
          message: t(`open-in-explorer.message`, { type: t(`open-in-explorer.${type}`), key }),
          defaultId: 0,
          buttons: [t('common.ok'), t('common.cancel')],
        })
        .then(({ response }) => {
          if (response === 0) {
            const base = NetworksService.getInstance().explorerUrl()
            shell.openExternal(`${base}/${type}/${key}`)
          }
        })
    })

    handle('handle-view-error', async (_, error: string) => {
      if (env.isDevMode) {
        console.error(error)
      }
    })

    handle('set-locale', async (_, locale: Locale) => {
      return (SettingsService.getInstance().locale = locale)
    })

    handle('is-dark', async () => {
      return {
        status: ResponseCode.Success,
        result: nativeTheme.shouldUseDarkColors
      }
    })

    handle('set-theme', async (_, theme: 'system' | 'light' | 'dark') => {
      SettingsService.getInstance().themeSource = theme
      return {
        status: ResponseCode.Success
      }
    })

    handle('is-ckb-run-external', () => {
      return {
        status: ResponseCode.Success,
        result: NodeService.getInstance().isCkbNodeExternal,
      }
    })

    // Wallets

    handle('get-all-wallets', async () => {
      return this.#walletsController.getAll()
    })

    handle('get-current-wallet', async () => {
      return this.#walletsController.getCurrent()
    })

    handle('set-current-wallet', async (_, id: string) => {
      return this.#walletsController.activate(id)
    })

    handle('import-mnemonic', async (_, params: { name: string; password: string; mnemonic: string }) => {
      return this.#walletsController.importMnemonic(params)
    })

    handle('import-keystore', async (_, params: { name: string; password: string; keystorePath: string }) => {
      return this.#walletsController.importKeystore(params)
    })

    handle('create-wallet', async (_, params: { name: string; password: string; mnemonic: string }) => {
      return this.#walletsController.create(params)
    })

    handle('update-wallet', async (_, params: { id: string; password: string; name: string; newPassword?: string }) => {
      return this.#walletsController.update(params)
    })

    handle('delete-wallet', async (_, { id = '', password = '' }) => {
      return this.#walletsController.delete({ id, password })
    })

    handle('backup-wallet', async (_, { id = '', password = '' }) => {
      return this.#walletsController.backup({ id, password })
    })

    handle('export-xpubkey', async (_, id: string) => {
      return this.#walletsController.exportXPubkey(id)
    })

    handle('get-all-addresses', async (_, id: string) => {
      return this.#walletsController.getAllAddresses(id)
    })

    handle(
      'update-address-description',
      async (_, params: { walletID: string; address: string; description: string }) => {
        return this.#walletsController.updateAddressDescription(params)
      }
    )

    handle(
      'request-password',
      async (_, { walletID, action }: { walletID: string; action: 'delete-wallet' | 'backup-wallet' }) => {
        this.#walletsController.requestPassword(walletID, action)
      }
    )

    handle(
      'send-tx',
      async (
        _,
        params: {
          walletID: string
          tx: Transaction
          password: string
          description?: string
          multisigConfig?: MultisigConfigModel
        }
      ) => {
        return this.#walletsController.sendTx({
          ...params,
          multisigConfig: params.multisigConfig ? MultisigConfigModel.fromObject(params.multisigConfig) : undefined,
        })
      }
    )

    handle(
      'generate-tx',
      async (
        _,
        params: { walletID: string; items: { address: string; capacity: string }[]; fee: string; feeRate: string }
      ) => {
        return this.#walletsController.generateTx(params)
      }
    )

    handle(
      'generate-send-all-tx',
      async (
        _,
        params: { walletID: string; items: { address: string; capacity: string }[]; fee: string; feeRate: string }
      ) => {
        return this.#walletsController.generateSendingAllTx(params)
      }
    )

    handle(
      'generate-multisig-tx',
      async (_, params: { items: { address: string; capacity: string }[]; multisigConfig: MultisigConfigModel }) => {
        return this.#walletsController.generateMultisigTx({
          items: params.items,
          multisigConfig: MultisigConfigModel.fromObject(params.multisigConfig),
        })
      }
    )

    handle(
      'generate-multisig-send-all-tx',
      async (_, params: { items: { address: string; capacity: string }[]; multisigConfig: MultisigConfigModel }) => {
        return this.#walletsController.generateMultisigSendAllTx({
          items: params.items,
          multisigConfig: MultisigConfigModel.fromObject(params.multisigConfig),
        })
      }
    )

    handle('generate-mnemonic', async () => {
      return this.#walletsController.generateMnemonic()
    })

    handle('validate-mnemonic', async (_, mnemonic: string) => {
      return this.#walletsController.validateMnemonic(mnemonic)
    })

    // Transactions

    handle('get-transaction-list', async (_, params: Controller.Params.TransactionsByKeywords) => {
      return this.#transactionsController.getAll(params)
    })

    handle('get-transaction', async (_, { walletID, hash }: { walletID: string; hash: string }) => {
      return this.#transactionsController.get(walletID, hash)
    })

    handle(
      'update-transaction-description',
      async (_, params: { walletID: string; hash: string; description: string }) => {
        return this.#transactionsController.updateDescription(params)
      }
    )

    handle('show-transaction-details', async (_, hash: string) => {
      const win = showWindow(
        `#/transaction/${hash}`,
        t(`messageBox.transaction.title`, { hash }),
        {
          height: 750,
        },
        undefined,
        win => win.webContents.getURL().endsWith(`#/transaction/${hash}`)
      )

      if (win.isVisible()) return

      return new Promise((resolve, reject) => {
        win.once('ready-to-show', resolve)
        CommonUtils.sleep(3e3).then(() => {
          win.off('ready-to-show', resolve)
          reject(new Error('Show window timeout'))
        })
      })
    })

    handle('export-transactions', async (_, params: { walletID: string }) => {
      return this.#transactionsController.exportTransactions(params)
    })

    // Dao

    handle('get-dao-data', async (_, params: Controller.Params.GetDaoCellsParams) => {
      return this.#daoController.getDaoCells(params)
    })

    handle(
      'generate-dao-deposit-tx',
      async (_, params: { walletID: string; capacity: string; fee: string; feeRate: string }) => {
        return this.#daoController.generateDepositTx(params)
      }
    )

    handle(
      'generate-dao-deposit-all-tx',
      async (_, params: { walletID: string; isBalanceReserved: boolean; fee: string; feeRate: string }) => {
        return this.#daoController.generateDepositAllTx(params)
      }
    )

    handle(
      'start-withdraw-from-dao',
      async (_, params: { walletID: string; outPoint: OutPoint; fee: string; feeRate: string }) => {
        return this.#daoController.startWithdrawFromDao(params)
      }
    )

    handle(
      'withdraw-from-dao',
      async (
        _,
        params: {
          walletID: string
          depositOutPoint: OutPoint
          withdrawingOutPoint: OutPoint
          fee: string
          feeRate: string
        }
      ) => {
        return this.#daoController.withdrawFromDao(params)
      }
    )

    // Customized Asset
    handle('get-customized-asset-cells', async (_, params: Controller.Params.GetCustomizedAssetCellsParams) => {
      return this.#customizedAssetsController.getCustomizedAssetCells(params)
    })

    handle(
      'generate-withdraw-customized-cell-tx',
      async (_, params: Controller.Params.GenerateWithdrawCustomizedCellTxParams) => {
        return this.#customizedAssetsController.generateWithdrawCustomizedCellTx(params)
      }
    )

    handle('generate-transfer-nft-tx', async (_, params: Controller.Params.GenerateTransferNftTxParams) => {
      return this.#customizedAssetsController.generateTransferNftTx(params)
    })

    // Networks

    handle('get-all-networks', async () => {
      return this.#networksController.getAll()
    })

    handle('create-network', async (_, { name, remote, type = NetworkType.Normal }: Network) => {
      return this.#networksController.create({ name, remote, type, genesisHash: '0x', chain: 'ckb', id: '' })
    })

    handle('update-network', async (_, { networkID, options }: { networkID: string; options: Partial<Network> }) => {
      return this.#networksController.update(networkID, options)
    })

    handle('get-current-network-id', async () => {
      return this.#networksController.currentID()
    })

    handle('set-current-network-id', async (_, id: string) => {
      return this.#networksController.activate(id)
    })

    handle('delete-network', async (_, id: string) => {
      return this.#networksController.delete(id)
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

    handle('clear-cache', async (_, params: { resetIndexerData: boolean } | null) => {
      await IndexerService.clearCache(params?.resetIndexerData)
      return { status: ResponseCode.Success, result: true }
    })

    handle('get-ckb-node-data-path', () => {
      return {
        status: ResponseCode.Success,
        result: SettingsService.getInstance().ckbDataPath,
      }
    })

    handle('set-ckb-node-data-path', async (_, { dataPath, clearCache }: { dataPath: string; clearCache: boolean }) => {
      if (!clearCache && !fs.existsSync(path.join(dataPath, 'ckb.toml'))) {
        const { response } = await dialog.showMessageBox(BrowserWindow.getFocusedWindow()!, {
          type: 'info',
          message: t('messages.no-exist-ckb-node-data', { path: dataPath }),
          buttons: [t('common.ok'), t('common.cancel')],
        })
        if (response === 1) {
          return {
            status: ResponseCode.Fail
          }
        }
      }
      await cleanChain()
      SettingsService.getInstance().ckbDataPath = dataPath
      await startMonitor('ckb', true)
      return {
        status: ResponseCode.Success,
        result: SettingsService.getInstance().ckbDataPath,
      }
    })

    handle('start-process-monitor', (_, monitorName: string) => {
      startMonitor(monitorName, true)
      return {
        status: ResponseCode.Success
      }
    })

    handle('stop-process-monitor', async (_, monitorName: string) => {
      await Promise.race([stopMonitor(monitorName), CommonUtils.sleep(1000)])
      return {
        status: ResponseCode.Success
      }
    })

    // Sign and Verify
    handle('sign-message', async (_, params: Controller.Params.SignParams) => {
      return this.#signAndVerifyController.sign(params)
    })

    handle('verify-signature', async (_, params: Controller.Params.VerifyParams) => {
      return this.#signAndVerifyController.verify(params)
    })

    // sUDT

    handle('get-anyone-can-pay-script', () => {
      return this.#anyoneCanPayController.getScript()
    })

    handle('get-token-info-list', () => {
      return this.#assetAccountController.getTokenInfoList()
    })

    handle('generate-create-asset-account-tx', async (_, params: GenerateCreateAssetAccountTxParams) => {
      return this.#assetAccountController.generateCreateTx(params)
    })

    handle('send-create-asset-account-tx', async (_, params: SendCreateAssetAccountTxParams) => {
      return this.#assetAccountController.sendCreateTx(params)
    })

    handle('update-asset-account', async (_, params: UpdateAssetAccountParams) => {
      return this.#assetAccountController.update(params)
    })

    handle('asset-accounts', async (_, params: { walletID: string }) => {
      return this.#assetAccountController.getAll(params)
    })

    handle('get-asset-account', async (_, params: { walletID: string; id: number }) => {
      return this.#assetAccountController.getAccount(params)
    })

    handle('check-migrate-acp', async () => {
      const allowMultipleOpen = true
      return this.#assetAccountController.showACPMigrationDialog(allowMultipleOpen)
    })

    handle('migrate-acp', async (_, params: MigrateACPParams) => {
      return this.#assetAccountController.migrateAcp(params)
    })

    handle('generate-create-cheque-tx', async (_, params: GenerateCreateChequeTxParams) => {
      return this.#assetAccountController.generateCreateChequeTx(params)
    })

    handle('generate-claim-cheque-tx', async (_, params: GenerateClaimChequeTxParams) => {
      return this.#assetAccountController.generateClaimChequeTx(params)
    })

    handle('generate-withdraw-cheque-tx', async (_, params: GenerateWithdrawChequeTxParams) => {
      return this.#assetAccountController.generateWithdrawChequeTx(params)
    })

    handle('generate-send-to-anyone-can-pay-tx', async (_, params: GenerateAnyoneCanPayTxParams) => {
      return this.#anyoneCanPayController.generateTx(params)
    })

    handle('get-hold-sudt-cell-capacity', async (_, params: { address: string; tokenID: string }) => {
      return this.#anyoneCanPayController.getHoldSudtCellCapacity(params.address, params.tokenID)
    })

    handle('send-to-anyone-can-pay', async (_, params: SendAnyoneCanPayTxParams) => {
      return this.#anyoneCanPayController.sendTx(params)
    })

    handle('generate-sudt-migrate-acp-tx', async (_, params) => {
      return this.#anyoneCanPayController.generateSudtMigrateAcpTx(params)
    })

    handle('get-sudt-token-info', async (_, params: { tokenID: string }) => {
      return this.#sudtController.getSUDTTokenInfo(params)
    })

    handle('get-sudt-type-script-hash', async (_, params: { tokenID: string }) => {
      return this.#sudtController.getSUDTTypeScriptHash(params)
    })

    handle('generate-destroy-asset-account-tx', async (_, params: { walletID: string; id: number }) => {
      return this.#assetAccountController.destoryAssetAccount(params)
    })

    // Hardware wallet
    handle('connect-device', async (_, deviceInfo: DeviceInfo) => {
      await this.#hardwareController.connectDevice(deviceInfo)
    })

    handle('detect-device', async (_, model: Pick<DeviceInfo, 'manufacturer' | 'product'>) => {
      return this.#hardwareController.detectDevice(model)
    })

    handle('get-device-ckb-app-version', async () => {
      return this.#hardwareController.getCkbAppVersion()
    })

    handle('get-device-firmware-version', async () => {
      return this.#hardwareController.getFirmwareVersion()
    })

    handle('get-device-extended-public-key', async () => {
      return this.#hardwareController.getExtendedPublicKey()
    })

    handle('get-device-public-key', async () => {
      return this.#hardwareController.getPublicKey()
    })

    handle('create-hardware-wallet', async (_, params: ExtendedPublicKey & { walletName: string }) => {
      return await this.#walletsController.importHardwareWallet(params)
    })

    // Offline sign
    handle('export-transaction-as-json', async (_, params) => {
      return this.#offlineSignController.exportTransactionAsJSON(params)
    })

    handle('sign-transaction-only', async (_, params) => {
      return this.#offlineSignController.signTransaction(params)
    })

    handle('broadcast-transaction-only', async (_, params) => {
      return this.#offlineSignController.broadcastTransaction(params)
    })

    handle('sign-and-export-transaction', async (_, params) => {
      return this.#offlineSignController.signAndExportTransaction({
        ...params,
        multisigConfig: params?.multisigConfig ? MultisigConfigModel.fromObject(params?.multisigConfig) : undefined,
      })
    })

    handle('sign-and-broadcast-transaction', async (_, params) => {
      return this.#offlineSignController.signAndBroadcastTransaction({
        ...params,
        multisigConfig: params?.multisigConfig ? MultisigConfigModel.fromObject(params?.multisigConfig) : undefined,
      })
    })

    // multi sign

    handle('save-multisig-config', async (_, params) => {
      return this.#multisigController.saveConfig(params)
    })

    handle('update-multisig-config', async (_, params) => {
      return this.#multisigController.updateConfig(params)
    })

    handle('delete-multisig-config', async (_, params) => {
      return this.#multisigController.deleteConfig(params)
    })

    handle('get-multisig-config', async (_, walletId: string) => {
      return this.#multisigController.getConfig(walletId)
    })

    handle('import-multisig-config', async (_, walletId: string) => {
      return this.#multisigController.importConfig(walletId)
    })

    handle('export-multisig-config', async (_, params) => {
      return this.#multisigController.exportConfig(params)
    })

    handle('get-multisig-balances', async (_, params) => {
      return this.#multisigController.getMultisigBalances(params)
    })

    handle('load-multisig-tx-json', async (_, fullPayload) => {
      return this.#multisigController.loadMultisigTxJson(fullPayload)
    })

    //migrate
    handle('start-migrate', async () => {
      migrateCkbData()
      return {
        status: ResponseCode.Success
      }
    })

    //light client
    handle('get-sync-progress-by-addresses', async (_, hashes: string[]) => {
      return {
        result: await SyncProgressService.getSyncProgressByHashes(hashes),
        status: ResponseCode.Success,
      }
    })
  }

  // Register handler, warp and serialize API response
  #handleChannel = (channel: string, listener: (event: IpcMainInvokeEvent, ...args: any[]) => Promise<void> | any) => {
    ipcMain.handle(channel, async (event, args) => {
      try {
        const res = await listener(event, args)
        // All objects, array, class instance need to be serialized before sent to the IPC
        return typeof res === 'object' ? JSON.parse(JSON.stringify(res)) : res
      } catch (err) {
        logger.warn(`API Controller:\tchannel handling error: ${err}`, err.stack)

        if (err.code === 'ECONNREFUSED') {
          const NODE_DISCONNECTED_CODE = 104
          err.code = NODE_DISCONNECTED_CODE
        }

        try {
          /**
           * error.message from ckb node is a stringified error object with code and message
           */
          const e = JSON.parse(err.message)
          if (!Number.isNaN(+e.code)) {
            return {
              status: ResponseCode.Fail,
              message: e.message || err.message
            }
          }
        } catch {
          // ignore
        }

        return {
          status: err.code || ResponseCode.Fail,
          message: typeof err.message === 'string' ? { content: CommonUtils.tryParseError(err.message) } : err.message
        }
      }
    })
  }
}
