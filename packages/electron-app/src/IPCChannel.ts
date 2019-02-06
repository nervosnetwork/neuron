import { ipcMain } from 'electron'
import { IPC_CHANNEL } from './utils/const'

const listenToChannel = () => {
  ipcMain.on(IPC_CHANNEL.SEND_CAPACITY, (e: Electron.Event, { addr, capacity }: { addr: string; capacity: number }) => {
    console.log(`Send Capacity to CKB with ${JSON.stringify({ addr, capacity }, null, 2)}`)
    setTimeout(() => {
      e.sender.send(IPC_CHANNEL.SEND_CAPACITY, {
        status: 1,
        msg: `Send ${capacity} Capacity to ${addr} Successfully`,
      })
    }, 1000)
  })

  ipcMain.on(IPC_CHANNEL.GET_LIVE_CELL, (e: Electron.Event, ...args: string[]) => {
    e.sender.send(IPC_CHANNEL.GET_LIVE_CELL, args)
  })

  ipcMain.on(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, (e: Electron.Event, ...args: string[]) => {
    setTimeout(() => {
      e.sender.send(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, args)
    }, 1000)
  })
}

export default listenToChannel
