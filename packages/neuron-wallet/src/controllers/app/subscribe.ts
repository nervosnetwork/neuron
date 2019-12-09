import { debounceTime, sampleTime } from 'rxjs/operators'

import CommandSubject from 'models/subjects/command'
import DataUpdateSubject from 'models/subjects/data-update'
import { DebouncedSystemScriptSubject } from 'models/subjects/system-script'
import { CurrentNetworkIDSubject, NetworkListSubject } from 'models/subjects/networks'
import { SyncedBlockNumberSubject, ConnectionStatusSubject } from 'models/subjects/node'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import dataUpdateSubject from 'models/subjects/data-update'
import AppUpdaterSubject from 'models/subjects/app-updater'

interface AppResponder {
  sendMessage: (channel: string, arg: any) => void
  updateMenu: () => void
}

const DEBOUNCE_TIME = 50
const SAMPLE_TIME = 500

export const subscribe = (dispatcher: AppResponder) => {
  NetworkListSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(({ currentNetworkList = [] }) => {
    dispatcher.sendMessage('network-list-updated', currentNetworkList)
  })
  CurrentNetworkIDSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(({ currentNetworkID = '' }) => {
    dispatcher.sendMessage('current-network-id-updated', currentNetworkID)
  })

  DebouncedSystemScriptSubject.subscribe(params => {
    dispatcher.sendMessage('system-script-updated', params)
  })

  ConnectionStatusSubject.pipe(debounceTime(DEBOUNCE_TIME)).subscribe(params => {
    dispatcher.sendMessage('connection-status-updated', params)
  })

  SyncedBlockNumberSubject.pipe(sampleTime(SAMPLE_TIME)).subscribe(params => {
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
  })

  CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async params => {
    dispatcher.updateMenu()
    if (params.currentWallet) {
      dataUpdateSubject.next({ dataType: 'current-wallet', actionType: 'update' })
    }
  })

  AppUpdaterSubject.subscribe(params => {
    dispatcher.updateMenu()
    dispatcher.sendMessage('app-updater-updated', params)
  })
}
