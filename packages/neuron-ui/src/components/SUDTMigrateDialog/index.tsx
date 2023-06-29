import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList'
import { MIN_CKB_REQUIRED_BY_NORMAL_SUDT, SHANNON_CKB_RATIO } from 'utils/const'
import styles from './sUDTMigrateDialog.module.scss'

const items = [
  {
    title: 'migrate-sudt.turn-into-new-account.title',
    subTitle: 'migrate-sudt.turn-into-new-account.sub-title',
    type: 'new-account',
  },
  {
    title: 'migrate-sudt.transfer-to-exist-account.title',
    subTitle: 'migrate-sudt.transfer-to-exist-account.sub-title',
    type: 'exist-account',
  },
]

const leastSUDTAccountCapacity = BigInt(MIN_CKB_REQUIRED_BY_NORMAL_SUDT) * BigInt(SHANNON_CKB_RATIO)

const SUDTMigrateDialog = ({
  cell,
  openDialog,
}: {
  cell: SpecialAssetCell
  openDialog?: (e: React.SyntheticEvent) => void
}) => {
  const [t] = useTranslation()
  const isNewSUDTAccountDisabled = useMemo(() => BigInt(cell.capacity) < leastSUDTAccountCapacity, [cell.capacity])
  return (
    <div className={styles.container}>
      <p>{t('migrate-sudt.title')}</p>
      {items.map((v, idx) => (
        <div
          key={v.title}
          data-type={v.type}
          className={`${isNewSUDTAccountDisabled && idx === 0 ? styles.disabled : ''} ${styles.actionContainer}`}
          onClick={isNewSUDTAccountDisabled && idx === 0 ? undefined : openDialog}
          onKeyPress={() => {}}
          role="button"
          tabIndex={idx}
        >
          <div>{t(v.title)}</div>
          <div className={styles.subTitle}>{t(v.subTitle)}</div>
        </div>
      ))}
    </div>
  )
}

SUDTMigrateDialog.displayName = 'SUDTMigrateDialog'

export default SUDTMigrateDialog
