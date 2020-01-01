import React from 'react'
import { useTranslation } from 'react-i18next'

import styles from 'containers/Navbar/navbar.module.scss'
import { MAX_TIP_BLOCK_DELAY } from 'utils/const'

const SyncStatus = ({
  tipBlockNumber = '',
  tipBlockTimestamp = 0,
  syncedBlockNumber = '',
  bufferBlockNumber = 10,
}: React.PropsWithoutRef<{
  tipBlockNumber: string
  tipBlockTimestamp: number
  syncedBlockNumber: string
  bufferBlockNumber?: number
}>) => {
  const [t] = useTranslation()
  if (tipBlockNumber === '') {
    return (
      <div className={styles.sync}>
        <span>{t('navbar.fail-to-fetch-tip-block-number')}</span>
      </div>
    )
  }

  if (BigInt(syncedBlockNumber) < BigInt(0) || tipBlockNumber === '0') {
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
        <span title={percentage}>
          {t(`sync.${tipBlockTimestamp + MAX_TIP_BLOCK_DELAY >= Date.now() ? 'synced' : 'syncing'}`)}
        </span>
      )}
    </div>
  )
}

SyncStatus.displayName = 'SyncStatus'
export default SyncStatus
