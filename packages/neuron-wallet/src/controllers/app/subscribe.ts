import { debounceTime } from 'rxjs/operators'

import CommandSubject from 'models/subjects/command'
import DataUpdateSubject from 'models/subjects/data-update'
import { DebouncedSystemScriptSubject } from 'models/subjects/system-script'
import { DebouncedCurrentNetworkIDSubject, DebouncedNetworkListSubject } from 'models/subjects/networks'
import { SampledSyncedBlockNumberSubject, DebouncedConnectionStatusSubject } from 'models/subjects/node'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import dataUpdateSubject from 'models/subjects/data-update'
import AppUpdaterSubject from 'models/subjects/app-updater'

interface AppResponder {
  sendMessage: (channel: string, arg: any) => void
  updateMenu: () => void
}

export const subscribe = (dispatcher: AppResponder) => {
  DebouncedNetworkListSubject.subscribe(({ currentNetworkList = [] }) => {
    dispatcher.sendMessage('network-list-updated', currentNetworkList)
  })
  DebouncedCurrentNetworkIDSubject.subscribe(({ currentNetworkID = '' }) => {
    dispatcher.sendMessage('current-network-id-updated', currentNetworkID)
  })

  DebouncedSystemScriptSubject.subscribe(params => {
    dispatcher.sendMessage('system-script-updated', params)
  })

  DebouncedConnectionStatusSubject.subscribe(params => {
    dispatcher.sendMessage('connection-status-updated', params)
  })

  SampledSyncedBlockNumberSubject.subscribe(params => {
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
