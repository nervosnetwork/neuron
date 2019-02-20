import { Channel } from './const'

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
      console.warn(
        `Message: ${msg} to channel ${channel} failed due to Electron not loaded`,
      )
    },
    on: (channel: string, cb: Function) => {
      console.warn(
        `Channel ${channel} and Function ${cb.toString()} failed due to Electron not laoded`,
      )
    },
  }
})()

const asw = () => ipcRenderer.send('ASW')
const getLiveCell = (outpoint: any) => ipcRenderer.send('getLiveCell', outpoint)
const getCellsByTypeHash = (typeHash: string) => {
  ipcRenderer.send(Channel.GetCellsByTypeHash, typeHash)
}
const sendCapacity = (address: string, capacity: string) => {
  ipcRenderer.send(Channel.SendCapacity, {
    address,
    capacity,
  })
}

export default {
  asw,
  getLiveCell,
  getCellsByTypeHash,
  sendCapacity,
}
