import { ResponseCode, ErrorCode, isSuccessResponse } from 'utils'
import { ipcRenderer } from 'electron'

export interface SuccessFromController<R = any> {
  status: ResponseCode.SUCCESS
  result: R | null
}

export interface FailureFromController {
  status: ResponseCode.FAILURE | ErrorCode.CapacityNotEnoughForChange | number
  message:
    | string
    | {
        content?: string
        meta?: { [key: string]: string }
      }
}

export type ControllerResponse<R = any> = SuccessFromController<R> | FailureFromController

export const RemoteNotLoadError = {
  status: ResponseCode.FAILURE,
  message: {
    content: 'The remote module is not found, please make sure the UI is running inside the Electron App',
  },
}

// API wrapper using Electron 7 invoke/handle
// Action: Electron channel
type Action =
  // App
  | 'get-system-codehash'
  | 'load-init-data'
  | 'open-in-window'
  | 'request-open-in-explorer'
  | 'handle-view-error'
  | 'set-locale'
  | 'show-error-message'
  | 'show-open-dialog'
  | 'show-open-dialog-modal'
  | 'open-external'
  | 'open-context-menu'
  | 'get-all-displays-size'
  | 'show-message-box'
  | 'get-ckb-node-data-path'
  | 'set-ckb-node-data-path'
  | 'stop-process-monitor'
  | 'start-process-monitor'
  | 'is-dark'
  | 'set-theme'
  | 'is-ckb-run-external'
  // Wallets
  | 'get-all-wallets'
  | 'get-current-wallet'
  | 'set-current-wallet'
  | 'import-mnemonic'
  | 'import-keystore'
  | 'create-wallet'
  | 'update-wallet'
  | 'delete-wallet'
  | 'backup-wallet'
  | 'get-all-addresses'
  | 'update-address-description'
  | 'request-password'
  | 'send-tx'
  | 'generate-tx'
  | 'generate-send-all-tx'
  | 'generate-mnemonic'
  | 'validate-mnemonic'
  | 'sign-message'
  | 'verify-signature'
  // Transactions
  | 'get-transaction-list'
  | 'get-transaction'
  | 'show-transaction-details'
  | 'update-transaction-description'
  | 'export-transactions'
  // Dao
  | 'get-dao-data'
  | 'generate-dao-deposit-tx'
  | 'generate-dao-deposit-all-tx'
  | 'start-withdraw-from-dao'
  | 'withdraw-from-dao'
  // Special Assets
  | 'get-customized-asset-cells'
  | 'generate-withdraw-customized-cell-tx'
  // Networks
  | 'get-all-networks'
  | 'create-network'
  | 'update-network'
  | 'get-current-network-id'
  | 'set-current-network-id'
  | 'delete-network'
  // Updater
  | 'check-for-updates'
  | 'download-update'
  | 'quit-and-install-update'
  // Settings
  | 'clear-cache'
  // SUDT
  | 'get-anyone-can-pay-script'
  | 'asset-accounts'
  | 'get-asset-account'
  | 'send-create-asset-account-tx'
  | 'update-asset-account'
  | 'generate-create-asset-account-tx'
  | 'generate-send-to-anyone-can-pay-tx'
  | 'generate-send-all-to-anyone-can-pay-tx'
  | 'send-to-anyone-can-pay'
  | 'get-token-info-list'
  | 'migrate-acp'
  | 'check-migrate-acp'
  | 'get-sudt-token-info'
  | 'generate-destroy-asset-account-tx'
  | 'get-sudt-type-script-hash'
  | 'generate-sudt-migrate-acp-tx'
  // Cheque
  | 'generate-create-cheque-tx'
  | 'generate-withdraw-cheque-tx'
  | 'send-withdraw-cheque-tx'
  | 'generate-claim-cheque-tx'
  // Hardware Wallet
  | 'detect-device'
  | 'get-device-ckb-app-version'
  | 'get-device-firmware-version'
  | 'get-device-public-key'
  | 'get-device-extended-public-key'
  | 'connect-device'
  | 'create-hardware-wallet'
  // offline-signature
  | 'export-transaction-as-json'
  | 'sign-transaction-only'
  | 'broadcast-transaction-only'
  | 'sign-and-export-transaction'
  | 'sign-and-broadcast-transaction'
  // nft
  | 'generate-transfer-nft-tx'
  // multisig
  | 'save-multisig-config'
  | 'get-multisig-config'
  | 'import-multisig-config'
  | 'export-multisig-config'
  | 'update-multisig-config'
  | 'delete-multisig-config'
  | 'get-multisig-balances'
  | 'generate-multisig-tx'
  | 'generate-multisig-send-all-tx'
  | 'load-multisig-tx-json'
  | 'get-hold-sudt-cell-capacity'
  | 'start-migrate'
  | 'get-sync-progress-by-addresses'

export const remoteApi =
  <P = any, R = any>(action: Action) =>
  async (params: P): Promise<ControllerResponse<R>> => {
    const res: SuccessFromController<R> | FailureFromController = await ipcRenderer
      .invoke(action, params)
      .catch(() => ({
        status: ResponseCode.FAILURE,
        message: {
          content: 'Invalid response format',
        },
      }))

    if (!res) {
      return {
        status: ResponseCode.SUCCESS,
        result: null,
      }
    }

    if (isSuccessResponse(res)) {
      return {
        status: ResponseCode.SUCCESS,
        result: res.result ?? null,
      }
    }

    return {
      status: res.status ?? ResponseCode.FAILURE,
      message: typeof res.message === 'string' ? { content: res.message } : res.message ?? '',
    }
  }

export default { remoteApi }
