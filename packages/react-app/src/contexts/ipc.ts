import { createContext } from 'react'

declare global {
  interface Window {
    require: any
  }
}

const { ipcRenderer } = window.require('electron')

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

const ipcCtx = createContext(ipc)
export default ipcCtx
