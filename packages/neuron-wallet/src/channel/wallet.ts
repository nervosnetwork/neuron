import { BrowserWindow } from 'electron'

import Listeners from './listeners'
import { ChannelResponse } from '../controllers'
import NetworksController, { NetworksMethod } from '../controllers/netowrks'
import { Network } from '../services/networks'
import { WalletsMethod } from '../controllers/wallets'

import asw from '../wallets/asw'

import { Channel } from '../utils/const'
import { transactions, transactionCount } from '../mock'

export enum ResponseCode {
  Fail,
  Success,
}

export default class WalletChannel extends Listeners {
  public win: BrowserWindow

  public netowrksController: any

  constructor(window: BrowserWindow) {
    super()
    this.win = window
    this.netowrksController = new NetworksController(this)
  }

  public sendWallet = (
    wallet: any = {
      name: 'asw',
      address: asw.address,
      publicKey: asw.publicKey,
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

  public syncWallets = (params: { active?: ChannelResponse<any>; wallets?: ChannelResponse<any> }) => {
    if (!this.win) return
    if (params.active) {
      this.win.webContents.send(Channel.Wallets, WalletsMethod.Active, params.active)
    }
    if (params.wallets) {
      this.win.webContents.send(Channel.Wallets, WalletsMethod.Index, params.wallets)
    }
  }

  public syncNetworks = (params: {
    active?: ChannelResponse<Network>
    networks?: ChannelResponse<Network[]>
    status?: ChannelResponse<number>
  }) => {
    if (!this.win) return
    if (params.networks) {
      this.win.webContents.send(Channel.Networks, NetworksMethod.Index, params.networks)
    }
    if (params.active) {
      this.win.webContents.send(Channel.Networks, NetworksMethod.Active, params.active)
    }
    // TODO: status handler
    // if (params.status) {
    //   this.win.webContents.send(Channel.Networks, 'status', params.status)
    // }
  }
}
