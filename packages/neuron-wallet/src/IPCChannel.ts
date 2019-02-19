import { ipcMain } from 'electron'
import Core from '../../../node_modules/ckb-sdk-js/packages/ckb-sdk-core'
import { IPC_CHANNEL } from './utils/const'
import { cell } from './mock'

const remote = 'http://localhost:8114'
const ckbCore = new Core(remote)
const asw = ckbCore.wallet.newASW()

const listenToChannel = () => {
  // channel to send capacity
  ipcMain.on(IPC_CHANNEL.SEND_CAPACITY, (e: Electron.Event, { addr, capacity }: { addr: string; capacity: number }) => {
    console.info(`Send Capacity to CKB with ${JSON.stringify({ addr, capacity }, null, 2)}`)
    setTimeout(() => {
      e.sender.send(IPC_CHANNEL.SEND_CAPACITY, {
        status: 1,
        msg: `Send ${capacity} Capacity to ${addr} Successfully`,
      })
    }, 1000)
  })

  // channel to get live cells
  ipcMain.on(IPC_CHANNEL.GET_LIVE_CELL, (e: Electron.Event, ...args: string[]) => {
    e.sender.send(IPC_CHANNEL.GET_LIVE_CELL, args)
  })

  // channel to get cells by type hash
  ipcMain.on(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, (e: Electron.Event, ...args: string[]) => {
    console.info(`get cells by type hash ${args[0]}`)
    setTimeout(() => {
      e.sender.send(IPC_CHANNEL.GET_CELLS_BY_TYPE_HASH, {
        status: 1,
        result: [cell],
      })
    }, 1000)
  })

  ipcMain.on('ASW', (e: Electron.Event) => {
    e.sender.send('ASW', {
      status: 1,
      result: asw,
    })
  })
}

export default listenToChannel
