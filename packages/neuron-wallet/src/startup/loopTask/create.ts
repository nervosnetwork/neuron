import { BrowserWindow } from 'electron'
import path from 'path'
import { Subject, BehaviorSubject } from 'rxjs'
import SyncBlocksService from '../../services/syncBlocks'
import initConnection from '../../typeorm'
import Address from '../../services/addresses'
import TransactionsService from '../../services/transactions'

const loadURL = `file://${path.join(__dirname, 'index.html')}`

const stopLoopSubject = new Subject()

// TODO: mock as an address subject
const addressChangeSubject = new Subject()

// TODO: mock as an network init or change subject
// init-message means network not initialized
const networkChangeSubject = new BehaviorSubject('init-message')
networkChangeSubject.next('testnet')

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

// call this after network switched
// TODO: listen to network switch
const switchNetwork = async (networkId: string) => {
  // stop all blocks service
  stopLoopSubject.next('stop')
  // disconnect old connection and connect to new database
  await initConnection(networkId)
  // load lockHashes
  const lockHashes: string[] = await loadAddressesAndConvert()
  // start sync blocks service
  const syncBlocksService = new SyncBlocksService(lockHashes)

  // TODO: should change to listen real address module event
  addressChangeSubject.subscribe(async () => {
    syncBlocksService.lockHashes = await loadAddressesAndConvert()
  })

  stopLoopSubject.subscribe(() => {
    syncBlocksService.stop()
  })

  await syncBlocksService.loopBlocks()
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

    // TODO: add an event on networkId for when it init and changed, it should broadcast a message with networkId
    networkChangeSubject.subscribe(async (networkId: string) => {
      if (networkId !== 'init-message') {
        await switchNetwork(networkId)
      }
    })
  })

  loopWindow.on('closed', () => {
    loopWindow = null
  })

  return loopWindow
}

export default createLoopTask
