import { BrowserWindow } from 'electron'
import path from 'path'
import SyncBlocksService from '../../services/syncBlocks'
import initConnection from '../../typeorm'
import Address from '../../services/addresses'
import TransactionsService from '../../services/transactions'

const loadURL = `file://${path.join(__dirname, 'index.html')}`

// maybe should call this every time when new address generated
// load all addresses and convert to lockHashes
const loadAddressesAndConvert = async (): Promise<string[]> => {
  const addresses: string[] = Address.allAddresses().map(addr => addr.address)
  const lockHashes: string[] = await Promise.all(
    addresses.map(async addr => {
      return TransactionsService.addressToLockHash(addr)
    }),
  )
  return lockHashes
}

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

  loopWindow.loadURL(loadURL)

  loopWindow.on('ready-to-show', async () => {
    loopWindow!.hide()

    // TODO: call this function after get network name
    await initConnection('testnet')
    const lockHashes: string[] = await loadAddressesAndConvert()
    const syncBlocksService = new SyncBlocksService(lockHashes)
    await syncBlocksService.loopBlocks()
  })

  loopWindow.on('closed', () => {
    loopWindow = null
  })

  return loopWindow
}

export default createLoopTask
