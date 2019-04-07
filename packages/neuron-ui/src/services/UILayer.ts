import { Network } from '../contexts/Chain'
import { RawNetwork } from '../components/NetworkEditor'

import { Channel, CapacityUnit } from '../utils/const'
import SyntheticEventEmitter from '../utils/SyntheticEventEmitter'
import instantiateMethodCall from '../utils/instantiateMethodCall'

declare global {
  interface Window {
    require: any
    bridge: any
  }
}
export enum WalletsMethod {
  Index = 'index',
  GenerateMnemonic = 'generateMnemonic',
  ImportMnemonic = 'importMnemonic',
  ImportKeystore = 'importKeystore',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  Active = 'active',
  SetActive = 'setActive',
  Backup = 'backup',
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
      console.warn(`Channel ${channel} cannot be removed due to Electron not loaded`)
    },
    addEventListener: (event: string, cb: EventListenerOrEventListenerObject) => window.addEventListener(event, cb),
  }
})()

export const sendCapacity = (items: TransferItem[], password: string) => {
  return UILayer.sendSync(Channel.SendCapacity, {
    items,
    password,
  })
}

export const checkPassword = (walletID: string, password: string, handleResult: any) => {
  UILayer.on(Channel.CheckWalletPassword, (_e: any, args: ChannelResponse<string>) => {
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
export const networksCall = instantiateMethodCall(networks) as {
  index: () => void
  show: (id: string) => void
  create: (network: RawNetwork) => void
  update: (network: Network) => void
  delete: (id: string) => void
  active: () => void
  setActive: (id: string) => void
}

export const transactions = (method: TransactionsMethod, params: string | GetTransactionsParams) => {
  UILayer.send(Channel.Transactions, method, params)
}

export const transactionsCall = instantiateMethodCall(transactions) as {
  index: (params: GetTransactionsParams) => void
  show: (hash: string) => void
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

export const walletsCall = instantiateMethodCall(wallets) as {
  index: () => void
  generateMnemonic: () => void
  importKeystore: (params: { name: string; keystore: string; password: string }) => void
  importMnemonic: (params: { name: string; mnemonic: string; password: string }) => void
  update: (params: { id: string; name?: string; password: string; newPassword?: string }) => void
  delete: (params: { id: string; password: string }) => void
  export: (id: string) => void
  active: () => void
  setActive: (id: string) => void
  backup: (id: string) => void
}

export default UILayer
