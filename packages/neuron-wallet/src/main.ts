import 'reflect-metadata'
import { debounceTime } from 'rxjs/operators'

import AppController from 'controllers/app'
import createSyncBlockTask from 'startup/sync-block-task/create'
import initConnection from 'database/address/ormconfig'
import WalletsService from 'services/wallets'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import dataUpdateSubject from 'models/subjects/data-update'
import app from 'app'
import { changeLanguage } from 'utils/i18n'

const walletsService = WalletsService.getInstance()

const openWindow = () => {
  AppController.openWindow()
}

app.on('ready', async () => {
  changeLanguage(app.getLocale())

  WalletListSubject.pipe(debounceTime(50)).subscribe(({ currentWallet = null, currentWalletList = [] }) => {
    const walletList = currentWalletList.map(({ id, name }) => ({ id, name }))
    const currentWalletId = currentWallet ? currentWallet.id : null
    dataUpdateSubject.next({ dataType: 'wallets', actionType: 'update' })
    AppController.updateApplicationMenu(walletList, currentWalletId)
  })

  CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async ({ currentWallet = null, walletList = [] }) => {
    AppController.updateApplicationMenu(walletList, currentWallet ? currentWallet.id : null)
    if (currentWallet) {
      dataUpdateSubject.next({ dataType: 'current-wallet', actionType: 'update' })
    }
  })

  const wallets = walletsService.getAll()
  const currentWallet = walletsService.getCurrent()

  AppController.updateApplicationMenu(wallets, currentWallet ? currentWallet.id : null)
  await initConnection()
  createSyncBlockTask()
  openWindow()
})

app.on('activate', openWindow)
