import { Network } from '../contexts/Chain'
import { Channel, CapacityUnit } from '../utils/const'
import SyntheticEventEmitter from '../utils/SyntheticEventEmitter'

declare global {
  interface Window {
    require: any
    bridge: any
  }
}

export enum NetworksMethod {
  Index = 'index',
  Show = 'show',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Active = 'active',
  SetActive = 'setActive',
}

export enum TransactionsMethod {
  Index = 'index',
  Show = 'show',
}
export enum WalletsMethod {
  Index = 'index',
  Create = 'create',
  Import = 'import',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Active = 'active',
  SetActive = 'setActive',
  Backup = 'backup',
}

export interface TransferItem {
  address: string
  capacity: string
  unit: CapacityUnit
}
export interface GetTransactionsParams {
  pageNo: number
  pageSize: number
  addresses: string[]
}

const UILayer = (() => {
  if (window.bridge) {
    return new SyntheticEventEmitter(window.bridge.ipcRenderer)
  }
  return {
    send: (channel: string, ...msg: any[]) => {
      console.warn(`Message: ${msg} to channel ${channel} failed due to Electron not loaded`)
    },
    sendSync: (channel: string, ...msg: any[]) => {
      console.warn(`Message: ${msg} to channel ${channel} failed due to Electron not loaded`)
    },
    on: (channel: string, cb: Function) => {
      console.warn(`Channel ${channel} and Function ${cb.toString()} failed due to Electron not loaded`)
    },
    once: (channel: string, cb: Function) => {
      console.warn(`Channel ${channel} and Function ${cb.toString()} failed due to Electron not loaded`)
    },
    removeAllListeners: (channel?: string) => {
      console.warn(`Channel ${channel} cannot removed due to Electron not loaded`)
    },
    addEventListener: (event: string, cb: EventListenerOrEventListenerObject) => window.addEventListener(event, cb),
  }
})()

export const asw = () => UILayer.send('ASW')

export const getWallets = () => {
  UILayer.send(Channel.GetWallets)
}

export const sendCapacity = (items: TransferItem[], password: string) => {
  return UILayer.sendSync(Channel.SendCapacity, {
    items,
    password,
  })
}

export const checkPassword = (walletID: string, password: string, handleResult: any) => {
  UILayer.on(Channel.CheckWalletPassword, (_e: any, args: Response<string>) => {
    handleResult(args)
  })
  UILayer.send(Channel.CheckWalletPassword, {
    walletID,
    password,
  })
}

export const networks = (method: NetworksMethod, params: string | Network) => {
  UILayer.send(Channel.Networks, method, params)
}
export const transactions = (method: TransactionsMethod, params: GetTransactionsParams | string) => {
  UILayer.send(Channel.Transactions, method, params)
}

export const wallets = (
  method: WalletsMethod,
  params:
    | undefined
    | string
    | { name: string; password: string }
    | { keystore: string; password: string }
    | { mnemonic: string; password: string }
    | { id: string; password: string }
    | { id: string; name?: string; password: string; newPassword?: string },
) => {
  UILayer.send(Channel.Wallets, method, params)
}

export default UILayer
