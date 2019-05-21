import { BrowserWindow } from 'electron'

import Listeners from './listeners'
import { ChannelResponse } from '../controllers'
import { NetworksMethod } from '../controllers/networks'
import { NetworkWithID } from '../services/networks'
import { WalletsMethod } from '../controllers/wallets'

import { Channel } from '../utils/const'
import { transactions, transactionCount } from '../mock'

export enum ResponseCode {
  Fail,
  Success,
}

export default class WalletChannel extends Listeners {
  public win: BrowserWindow

  constructor(window: BrowserWindow) {
    super()
    this.win = window
  }

  public sendWallet = (
    wallet: any = {
      name: '',
      address: '',
      publicKey: '',
    },
  ) => {
    this.win.webContents.send(Channel.Wallets, 'activeWallet', {
      status: ResponseCode.Success,
      result: wallet,
    })
  }

  public setUILocale = (locale: string) => {
    this.win.webContents.send(Channel.SetLanguage, {
      status: ResponseCode.Success,
      result: locale,
    })
  }

  public navTo = (route: string) => {
    this.win.webContents.send(Channel.NavTo, {
      status: ResponseCode.Success,
      result: {
        router: route,
      },
    })
  }

  public sendTransactionHistory = ({
    pageNo,
    pageSize,
    addresses,
  }: {
    pageNo: number
    pageSize: number
    addresses: string[]
  }) => {
    this.win.webContents.send(Channel.GetTransactions, {
      status: ResponseCode.Success,
      result: {
        addresses,
        pageNo,
        pageSize,
        totalCount: transactionCount,
        items: transactions.map(tx => ({
          ...tx,
          value: +tx.value * pageNo * pageSize,
        })),
      },
    })
  }

  public syncWallets = (params: { activeOne?: ChannelResponse<any>; wallets?: ChannelResponse<any> }) => {
    if (!this.win) return
    if (params.activeOne) {
      this.win.webContents.send(Channel.Wallets, WalletsMethod.GetActive, params.activeOne)
    }
    if (params.wallets) {
      this.win.webContents.send(Channel.Wallets, WalletsMethod.GetAll, params.wallets)
    }
  }

  public syncNetworks = (params: {
    active?: ChannelResponse<NetworkWithID>
    networks?: ChannelResponse<NetworkWithID[]>
    status?: ChannelResponse<number>
  }) => {
    if (!this.win) return
    if (params.networks) {
      this.win.webContents.send(Channel.Networks, NetworksMethod.GetAll, params.networks)
    }
    if (params.active) {
      this.win.webContents.send(Channel.Networks, NetworksMethod.ActiveId, params.active)
    }
    // TODO: status handler
    // if (params.status) {
    //   this.win.webContents.send(Channel.Networks, 'status', params.status)
    // }
  }
}
