import { BrowserWindow } from 'electron'
import { t } from 'i18next'
import { debounceTime } from 'rxjs/operators'

import CommandSubject from 'models/subjects/command'
import DataUpdateSubject from 'models/subjects/data-update'
import { CurrentNetworkIDSubject, NetworkListSubject } from 'models/subjects/networks'
import { ConnectionStatusSubject } from 'models/subjects/node'
import { WalletListSubject, CurrentWalletSubject } from 'models/subjects/wallets'
import AppUpdaterSubject from 'models/subjects/app-updater'
import { SETTINGS_WINDOW_TITLE } from 'utils/const'
import SyncStateSubject from 'models/subjects/sync-state-subject'
import DeviceSignIndexSubject from 'models/subjects/device-sign-index-subject'
import SyncApiController from 'controllers/sync-api'

interface AppResponder {
  sendMessage: (channel: string, arg: any) => void
  runCommand: (command: string, arg: any) => void
  updateMenu: () => void
  updateWindowTitle: () => void
}

/**
 * subscribe to events and dispatch them to the renderer process
 */
export const subscribe = (dispatcher: AppResponder) => {
  NetworkListSubject.pipe(debounceTime(50)).subscribe(({ currentNetworkList = [] }) => {
    dispatcher.sendMessage('network-list-updated', currentNetworkList)
  })

  CurrentNetworkIDSubject.pipe(debounceTime(50)).subscribe(({ currentNetworkID = '' }) => {
    dispatcher.sendMessage('current-network-id-updated', currentNetworkID)
  })

  ConnectionStatusSubject.pipe(debounceTime(50)).subscribe(params => {
    dispatcher.sendMessage('connection-status-updated', params)
  })

  SyncStateSubject.pipe(debounceTime(50)).subscribe(estimation => {
    const cachedEstimation = SyncApiController.getInstance().getCachedEstimation()
    if (cachedEstimation) {
      estimation.estimate = cachedEstimation.estimate
    }
    dispatcher.sendMessage('sync-estimate-updated', estimation)
    // dispatcher.sendMessage('synced-block-number-updated', params)

    dispatcher.runCommand('migrate-acp', '')
  })

  CommandSubject.subscribe(params => {
    if (params.dispatchToUI) {
      BrowserWindow.getFocusedWindow()?.webContents.send('command', params)
    } else {
      dispatcher.runCommand(params.type, params.payload)
    }
  })

  DataUpdateSubject.subscribe(data => {
    dispatcher.sendMessage('data-updated', data)
  })

  WalletListSubject.pipe(debounceTime(50)).subscribe(() => {
    DataUpdateSubject.next({ dataType: 'wallets', actionType: 'update' })
    dispatcher.updateMenu()
    dispatcher.updateWindowTitle()
  })

  CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async params => {
    dispatcher.updateMenu()
    if (params.currentWallet) {
      DataUpdateSubject.next({ dataType: 'current-wallet', actionType: 'update' })
    }
    dispatcher.updateWindowTitle()
  })

  DeviceSignIndexSubject.subscribe(index => {
    dispatcher.sendMessage('device-sign-index', index)
  })

  AppUpdaterSubject.subscribe(params => {
    dispatcher.updateMenu()
    BrowserWindow.getAllWindows()
      .find(bw => bw.getTitle() === t(SETTINGS_WINDOW_TITLE))
      ?.webContents.send('app-updater-updated', params)
  })
}
