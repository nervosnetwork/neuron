import { Channel } from 'utils/const'
import SyntheticEventEmitter from 'utils/SyntheticEventEmitter'
import instantiateMethodCall from 'utils/instantiateMethodCall'

export enum AppMethod {
  ToggleAddressBook = 'toggleAddressBook',
  ContextMenu = 'contextMenu',
  NavTo = 'navTo',
  SetUILocale = 'setUILocale',
  HandleViewError = 'handleViewError',
}

export enum ChainMethod {
  Status = 'status',
  TipBlockNumber = 'tipBlockNumber',
  SystemScript = 'systemScript',
}

export enum WalletsMethod {
  GetAll = 'getAll',
  Get = 'get',
  GenerateMnemonic = 'generateMnemonic',
  ImportMnemonic = 'importMnemonic',
  ImportKeystore = 'importKeystore',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Export = 'export',
  GetCurrent = 'getCurrent',
  Activate = 'activate',
  Backup = 'backup',
  SendCapacity = 'sendCapacity',
  SendingStatus = 'sendingStatus',
  UpdateAddressDescription = 'updateAddressDescription',
  RequestPassword = 'requestPassword',
  GetAllAddresses = 'getAllAddresses',
}

export enum NetworksMethod {
  GetAll = 'getAll',
  Get = 'get',
  Create = 'create',
  Update = 'update',
  Delete = 'delete',
  Activate = 'activate',
  CurrentID = 'currentID',
}

export enum TransactionsMethod {
  GetAll = 'getAll',
  GetAllByKeywords = 'getAllByKeywords',
  Get = 'get',
  UpdateDescription = 'updateDescription',
  TransactionUpdated = 'transactionUpdated',
}

export enum HelpersMethod {
  GenerateMnemonic = 'generateMnemonic',
}

export interface GetTransactionsParams {
  pageNo: number
  pageSize: number
  keywords?: string
  walletID: string
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

export const app = (method: AppMethod, ...params: any) => {
  UILayer.send(Channel.App, method, ...params)
}

export const appCalls = instantiateMethodCall(app) as {
  contextMenu: ({ type, id }: { type: string; id: string }) => void
  handleViewError: (errorMessage: string) => void
}

export const networks = (method: NetworksMethod, ...params: any[]) => {
  UILayer.send(Channel.Networks, method, ...params)
}
export const networksCall = instantiateMethodCall(networks) as {
  getAll: () => void
  get: (id: string) => void
  create: (network: State.NetworkProperty) => void
  update: (id: string, options: Partial<State.Network>) => void
  delete: (id: string) => void
  currentID: () => void
  activate: (id: string) => void
}

export const transactions = (method: TransactionsMethod, params: string | GetTransactionsParams) => {
  UILayer.send(Channel.Transactions, method, params)
}

export const transactionsCall = instantiateMethodCall(transactions) as {
  getAllByKeywords: (params: GetTransactionsParams) => void
  get: (walletID: string, hash: string) => void
  updateDescription: (params: { hash: string; description: string }) => void
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
    | { id: string; name?: string; password: string; newPassword?: string }
    | {
        id: string
        walletID: string
        items: { address: string; capacity: string }[]
        password: string
        fee: string
        description: string
      }
) => {
  UILayer.send(Channel.Wallets, method, params)
}

export const walletsCall = instantiateMethodCall(wallets) as {
  getAll: () => void
  get: (id: string) => void
  generateMnemonic: () => void
  importKeystore: (params: { name: string; keystore: string; password: string }) => void
  importMnemonic: (params: { name: string; mnemonic: string; password: string }) => void
  create: (params: { name: string; mnemonic: string; password: string }) => void
  update: (params: { id: string; password?: string; newPassword?: string; name?: string }) => void
  delete: (params: { id: string; password: string }) => void
  getCurrent: () => void
  activate: (id: string) => void
  backup: (params: { id: string; password: string }) => void
  sendCapacity: (params: {
    id: string
    walletID: string
    items: {
      address: string
      capacity: string
    }[]
    password: string
    fee: string
    description: string
  }) => void
  getAllAddresses: (id: string) => void
  updateAddressDescription: (params: { walletID: string; address: string; description: string }) => void
}

export const helpers = (method: HelpersMethod, ...params: any) => {
  return new Promise((res, rej) => {
    UILayer.send(Channel.Helpers, method, ...params)
    UILayer.once(Channel.Helpers, (_e: Event, _method: HelpersMethod, args: ChannelResponse<any>) => {
      if (args.status) {
        res(args.result)
      } else {
        rej(args.msg)
      }
    })
  })
}

export const helpersCall = instantiateMethodCall(helpers) as {
  generateMnemonic: () => Promise<string>
}

export default UILayer
