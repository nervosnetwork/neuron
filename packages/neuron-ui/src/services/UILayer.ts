import { Channel } from '../utils/const'
import SyntheticEventEmitter from '../utils/SyntheticEventEmitter'

declare global {
  interface Window {
    require: any
  }
}

const UILayer = (() => {
  if (window.require) {
    return new SyntheticEventEmitter(window.require('electron').ipcRenderer)
  }
  return {
    send: (channel: string, msg: any = '') => {
      console.warn(`Message: ${msg} to channel ${channel} failed due to Electron not loaded`)
    },
    on: (channel: string, cb: Function) => {
      console.warn(`Channel ${channel} and Function ${cb.toString()} failed due to Electron not loaded`)
    },
  }
})()

export const asw = () => UILayer.send('ASW')
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
export const getTransactions = (page: number, pageSize: number) => {
  UILayer.send(Channel.GetTransactions, {
    page,
    pageSize,
  })
}

export default UILayer
