import { BrowserWindow } from 'electron'
import env from '../env'
import SyncBlocksService from '../services/syncBlocks'
import initConnection from '../typeorm'

// create a background task to sync transactions
// this task is a renderer process
const createLoopTask = () => {
  let loopWindow: BrowserWindow | null = new BrowserWindow({
    x: 10,
    y: 10,
    show: false,
    webPreferences: {
      nodeIntegration: false,
    },
  })

  loopWindow.loadURL(env.mainURL)

  loopWindow.on('ready-to-show', async () => {
    loopWindow!.hide()

    // TODO: call this function after get network name
    await initConnection('testnet')
    const lockHashes: string[] = []
    const syncBlocksService = new SyncBlocksService(lockHashes)
    await syncBlocksService.loopBlocks()
  })

  loopWindow.on('closed', () => {
    loopWindow = null
  })

  return loopWindow
}

export default createLoopTask
