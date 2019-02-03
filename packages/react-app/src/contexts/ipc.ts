import { createContext } from 'react'

declare global {
  interface Window {
    require: any
  }
}

const ipcRenderer = (() => {
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

const ipc = {
  getLiveCell: (outpoint: any) => ipcRenderer.send('getLiveCell', outpoint),
  getCellsByTypeHash: (typeHash: string) => {
    console.log('get cells by type hash')
    ipcRenderer.send('getCellsByTypeHash', typeHash)
  },
  sendCapacity: (addr: string, capacity: string) => {
    console.log('send capacity')
    return ipcRenderer.send('sendCapacity', { addr, capacity })
  },
}

// on messages from neuron
ipcRenderer.on('getCellsByTypeHash', (_: any, args: any) => {
  console.log(args)
})

ipcRenderer.on('sendCapacity', (_: any, args: any) => {
  console.log(args)
})

const IPCContext = createContext(ipc)
export default IPCContext
