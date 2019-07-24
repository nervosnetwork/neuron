import { Channel } from 'utils/const'
import SyntheticEventEmitter from 'utils/SyntheticEventEmitter'
import instantiateMethodCall from 'utils/instantiateMethodCall'

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

export default UILayer
