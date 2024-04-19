import React from 'react'
import { useTranslation } from 'react-i18next'
import { shannonToCKBFormatter, SyncStatus } from 'utils'
import BalanceSyncIcon from 'components/BalanceSyncingIcon'
import CopyZone from 'widgets/CopyZone'

import styles from './balance.module.scss'

interface BalanceProps {
  balance: string
  connectionStatus: State.ConnectionStatus
  syncStatus: SyncStatus
}

const Balance = ({ balance, connectionStatus, syncStatus }: BalanceProps) => {
  const [t] = useTranslation()
  return (
    <>
      <span>{`${t('overview.balance')}:`}</span>
      <CopyZone content={shannonToCKBFormatter(balance, false, false)} name={t('overview.copy-balance')}>
        <span className={styles.balanceValue}>{shannonToCKBFormatter(balance)}</span>
      </CopyZone>
      <BalanceSyncIcon connectionStatus={connectionStatus} syncStatus={syncStatus} />
    </>
  )
}

Balance.displayName = 'Balance'

export default Balance
