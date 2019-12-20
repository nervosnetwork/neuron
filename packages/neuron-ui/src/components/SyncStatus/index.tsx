import React from 'react'
import { useTranslation } from 'react-i18next'

import styles from 'containers/Navbar/navbar.module.scss'

const SyncStatus = ({
  tipBlockNumber = '',
  syncedBlockNumber = '',
  bufferBlockNumber = 10,
}: React.PropsWithoutRef<{ tipBlockNumber: string; syncedBlockNumber: string; bufferBlockNumber?: number }>) => {
  const [t] = useTranslation()
  if (tipBlockNumber === '') {
    return (
      <div className={styles.sync}>
        <span>{t('navbar.fail-to-fetch-tip-block-number')}</span>
      </div>
    )
  }

  if (BigInt(syncedBlockNumber) < BigInt(0)) {
    return (
      <div className={styles.sync}>
        <span>{t('navbar.sync-not-start')}</span>
      </div>
    )
  }

  const percentage = `${((+syncedBlockNumber / +tipBlockNumber) * 100).toFixed(2)}%`

  return (
    <div className={styles.sync}>
      {+syncedBlockNumber + bufferBlockNumber < +tipBlockNumber ? (
        <>
          <span>{percentage}</span>
          <progress max={tipBlockNumber} value={syncedBlockNumber} />
        </>
      ) : (
        <span title={percentage}>{t('sync.synced')}</span>
      )}
    </div>
  )
}

SyncStatus.displayName = 'SyncStatus'
export default SyncStatus
