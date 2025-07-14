declare namespace Controller {
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
      sort?: string
      direction?: string
    }
    interface GenerateTransferNftTxParams {
      walletID: string
      outPoint: OutPoint
      receiveAddress: string
      feeRate: string
      description?: string
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

    interface SignRawParams {
      walletID: string
      address: string
      password: string
      message: string
    }

    interface SignParams {
      walletID: string
      address?: string
      password: string
      message: string
    }
    interface OpenChannelParams {
      me: Uint8Array
      peer: Uint8Array
      balances: [Uint8Array, Uint8Array]
      challengeDuration: number
    }
    interface UpdateChannelParams {
      channelId: string
      index: number
      amount: bigint
    }
    interface CloseChannelParams {
      channelId: Uint8Array
    }
    interface GetChannelsParams {
      requester: Uint8Array
    }
    interface RestoreChannelsParams {
      data: Uint8Array
    }
    interface PerunServiceActionParams {
      type: 'open' | 'update' | 'close' | 'get' | 'restore'
      payload: OpenChannelParams | UpdateChannelParams | CloseChannelParams | GetChannelParams | RestoreChannelsParams
    }

    interface RespondPerunRequestParams {
      type: 'SignMessage' | 'SignTransaction' | 'UpdateNotification'
      response: { rejected?: { reason: string }; data: any }
    }

    interface VerifyParams {
      address: string
      signature: string
      message: string
    }

    interface ShowSettings {
      tab: 'general' | 'wallets' | 'networks'
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
    type: 0 | 1 | 2 // 0 for the default type, 1 for the normal type, 2 for the light client
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
