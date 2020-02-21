declare module Controller {
  interface Response<T = any> {
    status: number
    message?:
      | string
      | {
          content?: string
          meta?: { [key: string]: string }
        }
    result?: T
  }

  namespace Params {
    interface TransactionsByKeywords {
      pageNo: number
      pageSize: number
      keywords: string
      walletID: string
    }
    interface TransactionsByAddresses {
      pageNo: number
      pageSize: number
      addresses: string
    }

    interface GetDaoCellsParams {
      walletID: string
    }

    interface GetCustomizedAssetCellsParams {
      walletID: string
      pageNo: number
      pageSize: number
    }

    interface GenerateWithdrawCustomizedCellTxParams {
      walletID: string
      outPoint: OutPoint
      fee: string
      feeRate: string
      customizedAssetInfo: {
        lock: string
        type: string
        data: string
      }
    }

    interface BackupWallet {
      id: string
      password: string
    }
    interface DeleteWallet {
      id: string
      password: string
    }

    interface SignParams {
      walletID: string
      address: string
      password: string
      message: string
    }

    interface VerifyParams {
      address: string
      signature: string
      message: string
    }
  }

  interface Wallet {
    id: string
    name: string
  }

  type NetworkID = string

  interface Network {
    id: NetworkID

    name: string
    remote: string
    type: 0 | 1 // 0 for the default type, 1 for the normal type
  }

  interface Address {
    address: string
    identifier: string
    type: number
    txCount: number
    description: string
    balance: string
  }
}
