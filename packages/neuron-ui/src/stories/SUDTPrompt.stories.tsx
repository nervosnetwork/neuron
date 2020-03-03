import React from 'react'
import { storiesOf } from '@storybook/react'
import SUDTPrompt, { SUDTPromptProps } from 'components/SUDTPrompt'
import { SyncStatus } from 'utils/const'

const stories = storiesOf('sUDT Prompt', module)

const props: { [name: string]: SUDTPromptProps } = {
  Offline: {
    connectionStatus: 'offline',
    syncStatus: SyncStatus.Syncing,
    hasItems: true,
  },
  'Sync not start': {
    connectionStatus: 'online',
    syncStatus: SyncStatus.SyncNotStart,
    hasItems: true,
  },
  Syncing: {
    connectionStatus: 'online',
    syncStatus: SyncStatus.Syncing,
    hasItems: true,
  },
  'Has no sUDT': {
    connectionStatus: 'online',
    syncStatus: SyncStatus.SyncCompleted,
    hasItems: false,
  },
  'Has sUDT': {
    connectionStatus: 'online',
    syncStatus: SyncStatus.SyncCompleted,
    hasItems: true,
  },
}

Object.keys(props).forEach(key => {
  stories.add(key, () => {
    return <SUDTPrompt {...props[key]} />
  })
})
