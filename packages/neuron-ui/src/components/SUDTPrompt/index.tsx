import React from 'react'
import { useTranslation } from 'react-i18next'
import { SyncStatus as SyncStatusEnum } from 'utils/const'

export interface SUDTPromptProps {
  connectionStatus: State.ConnectionStatus
  syncStatus: SyncStatusEnum
  hasItems: boolean
}

const SUDTPrompt = ({ connectionStatus, syncStatus, hasItems }: SUDTPromptProps) => {
  // TODO: add i18n for offline, sync not start
  const [t] = useTranslation()
  let i18nKey = 'syncing'
  if (connectionStatus === 'offline') {
    i18nKey = 'offline'
  } else if (syncStatus === SyncStatusEnum.SyncCompleted) {
    if (hasItems) {
      i18nKey = 'has-s-udt'
    } else {
      i18nKey = 'has-no-s-udt'
    }
  } else if ([SyncStatusEnum.SyncNotStart].includes(syncStatus)) {
    i18nKey = 'sync-not-start'
  }
  return <div>{t(`s-udt.prompt.${i18nKey}`)}</div>
}

SUDTPrompt.displayName = 'SUDTPrompt'

export default SUDTPrompt
