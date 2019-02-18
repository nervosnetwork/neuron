import { IPCChannel } from './const'

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

const getLiveCell = (outpoint: any) => ipcRenderer.send('getLiveCell', outpoint)
const getCellsByTypeHash = (typeHash: string) => {
  ipcRenderer.send(IPCChannel.GetCellsByTypeHash, typeHash)
}
const sendCapacity = (addr: string, capacity: string) => {
  ipcRenderer.send(IPCChannel.SendCapacity, {
    addr,
    capacity,
  })
}

export default {
  getLiveCell,
  getCellsByTypeHash,
  sendCapacity,
}
