import { IPC_CHANNEL } from './const'

declare global {
  interface Window {
    require: any
  }
}

export const ipcRenderer = (() => {
  if (window.require) {
    return window.require('electron').ipcRenderer
  }
  return {
    send: (channel: string, msg: any) => {
      console.warn(`Message: ${msg} to channel ${channel} failed due to Electron not loaded`)
    },
    on: (channel: string, cb: Function) => {
      console.warn(`Channel ${channel} and Function ${cb.toString()} failed due to Electron not laoded`)
    },
  }
})()

const asw = () => ipcRenderer.send('ASW')
const getLiveCell = (outpoint: any) => ipcRenderer.send('getLiveCell', outpoint)
const getCellsByTypeHash = (typeHash: string) => {
  ipcRenderer.send(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, typeHash)
}
const sendCapacity = (addr: string, capacity: string) => {
  ipcRenderer.send(IPC_CHANNEL.SEND_CAPACITY, {
    addr,
    capacity,
  })
}

export default {
  asw,
  getLiveCell,
  getCellsByTypeHash,
  sendCapacity,
}
