import { debounceTime, sampleTime } from 'rxjs/operators'

import CommandSubject from 'models/subjects/command'
import DataUpdateSubject from 'models/subjects/data-update'
import { CurrentNetworkIDSubject, NetworkListSubject } from 'models/subjects/networks'
import SyncedBlockNumberSubject, { ConnectionStatusSubject } from 'models/subjects/node'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import dataUpdateSubject from 'models/subjects/data-update'
import AppUpdaterSubject from 'models/subjects/app-updater'

interface AppResponder {
  sendMessage: (channel: string, arg: any) => void
  updateMenu: () => void
  updateWindowTitle: () => void
}

const DEBOUNCE_TIME = 50

export const subscribe = (dispatcher: AppResponder) => {
  NetworkListSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(({ currentNetworkList = [] }) => {
    dispatcher.sendMessage('network-list-updated', currentNetworkList)
  })

  CurrentNetworkIDSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(({ currentNetworkID = '' }) => {
    dispatcher.sendMessage('current-network-id-updated', currentNetworkID)
  })

  ConnectionStatusSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(params => {
    dispatcher.sendMessage('connection-status-updated', params)
  })

  SyncedBlockNumberSubject.getSubject().pipe(sampleTime(1000)).subscribe(params => {
    dispatcher.sendMessage('synced-block-number-updated', params)
  })

  CommandSubject.subscribe(params => {
    dispatcher.sendMessage('command', params)
  })

  DataUpdateSubject.subscribe(data => {
    dispatcher.sendMessage('data-updated', data)
  })

  WalletListSubject.pipe(debounceTime(50)).subscribe(() => {
    dataUpdateSubject.next({ dataType: 'wallets', actionType: 'update' })
    dispatcher.updateMenu()
    dispatcher.updateWindowTitle()
  })

  CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async params => {
    dispatcher.updateMenu()
    if (params.currentWallet) {
      dataUpdateSubject.next({ dataType: 'current-wallet', actionType: 'update' })
    }
    dispatcher.updateWindowTitle()
  })

  AppUpdaterSubject.subscribe(params => {
    dispatcher.updateMenu()
    dispatcher.sendMessage('app-updater-updated', params)
  })
}
