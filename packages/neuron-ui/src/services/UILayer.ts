import { Channel } from '../utils/const'
import SyntheticEventEmitter from '../utils/SyntheticEventEmitter'
import { Network } from '../contexts/Chain'

declare global {
  interface Window {
    require: any
    bridge: any
  }
}

const UILayer = (() => {
  if (window.bridge) {
    return new SyntheticEventEmitter(window.bridge.ipcRenderer)
  }
  return {
    send: (channel: string, msg: any = '') => {
      console.warn(`Message: ${msg} to channel ${channel} failed due to Electron not loaded`)
    },
    on: (channel: string, cb: Function) => {
      console.warn(`Channel ${channel} and Function ${cb.toString()} failed due to Electron not loaded`)
    },
    removeAllListeners: (channel?: string) => {
      console.warn(`Channel ${channel} cannot removed due to Electron not loaded`)
    },
    addEventListener: (event: string, cb: EventListenerOrEventListenerObject) => window.addEventListener(event, cb),
  }
})()

export const asw = () => UILayer.send('ASW')
export const createWallet = (wallet: { name: string; mnemonic: any; password: string }) =>
  UILayer.send(Channel.CreateWallet, wallet)

export const deleteWallet = (address: string) => UILayer.send(Channel.DeleteWallet, address)
export const importWallet = (wallet: { name: string; mnemonic: any; password: string }) =>
  UILayer.send(Channel.ImportWallet, wallet)
export const exportWallet = () => UILayer.send(Channel.ExportWallet)
export const getLiveCell = (outpoint: any) => UILayer.send('getLiveCell', outpoint)
export const getCellsByTypeHash = (typeHash: string) => {
  UILayer.send(Channel.GetCellsByTypeHash, typeHash)
}

export const sendCapacity = (address: string, capacity: string) => {
  UILayer.send(Channel.SendCapacity, {
    address,
    capacity,
  })
}
export const setNetwork = (network: Network) => {
  UILayer.send(Channel.SetNetwork, network)
}

export const getTransactions = (pageNo: number, pageSize: number) => {
  UILayer.send(Channel.GetTransactions, {
    pageNo,
    pageSize,
  })
}

export const getWallets = () => {
  UILayer.send(Channel.GetWallets)
}

export const checkPassword = (walletID: string, password: string, valid: any) => {
  UILayer.on(Channel.CheckWalletPassword, (_e: any, args: Response<string>) => {
    valid(args)
  })
  UILayer.send(Channel.CheckWalletPassword, {
    walletID,
    password,
  })
}

export default UILayer
