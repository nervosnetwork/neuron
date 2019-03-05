import { Channel } from '../utils/const'
import SyntheticEventEmitter from '../utils/SyntheticEventEmitter'

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
export const getTransactions = (pageNo: number, pageSize: number) => {
  UILayer.send(Channel.GetTransactions, {
    pageNo,
    pageSize,
  })
}

export default UILayer
