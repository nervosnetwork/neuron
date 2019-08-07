import { app } from 'electron'
import 'reflect-metadata'
import { debounceTime } from 'rxjs/operators'

import { updateApplicationMenu } from 'utils/application-menu'
import WindowManager from 'models/window-manager'
import createMainWindow from 'startup/create-main-window'
import createSyncBlockTask from 'startup/sync-block-task/create'
import initConnection from 'database/address/ormconfig'
import WalletsService from 'services/wallets'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import dataUpdateSubject from 'models/subjects/data-update'

const walletsService = WalletsService.getInstance()

const openWindow = () => {
  if (!WindowManager.mainWindow) {
    WindowManager.mainWindow = createMainWindow()
    WindowManager.mainWindow.on('closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
      if (WindowManager.mainWindow) {
        WindowManager.mainWindow.removeAllListeners()
        WindowManager.mainWindow = null
      }
    })
  }
}

app.on('ready', async () => {
  WalletListSubject.pipe(debounceTime(50)).subscribe(({ currentWallet = null, currentWalletList = [] }) => {
    const walletList = currentWalletList.map(({ id, name }) => ({ id, name }))
    const currentWalletId = currentWallet ? currentWallet.id : null
    dataUpdateSubject.next({ dataType: 'wallets', actionType: 'update' })
    updateApplicationMenu(walletList, currentWalletId)
  })

  CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async ({ currentWallet = null, walletList = [] }) => {
    updateApplicationMenu(walletList, currentWallet ? currentWallet.id : null)
    if (currentWallet) {
      dataUpdateSubject.next({ dataType: 'current-wallet', actionType: 'update' })
    }
  })

  const wallets = walletsService.getAll()
  const currentWallet = walletsService.getCurrent()

  updateApplicationMenu(wallets, currentWallet ? currentWallet.id : null)
  await initConnection()
  createSyncBlockTask()
  openWindow()
})

app.on('activate', openWindow)
