import CommandSubject from 'models/subjects/command'
import DataUpdateSubject from 'models/subjects/data-update'
import { DebouncedSystemScriptSubject } from 'models/subjects/system-script'
import { DebouncedCurrentNetworkIDSubject, DebouncedNetworkListSubject } from 'models/subjects/networks'
import { SampledSyncedBlockNumberSubject, DebouncedConnectionStatusSubject } from 'models/subjects/node'

interface MessageDispatchable {
  sendMessage: (channel: string, obj: any) => void
}

export const subscribe = (dispatcher: MessageDispatchable) => {
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
}
