import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SpecialAssetCell } from 'components/SpecialAssetList'
import { MIN_CKB_REQUIRED_BY_NORMAL_SUDT, SHANNON_CKB_RATIO } from 'utils/const'
import Dialog from 'widgets/Dialog'
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
  isDialogOpen,
  onCancel,
  openDialog,
}: {
  cell: SpecialAssetCell
  isDialogOpen: boolean
  onCancel: () => void
  openDialog?: (type: string) => void
}) => {
  const [t] = useTranslation()
  const isNewSUDTAccountDisabled = useMemo(() => BigInt(cell.capacity) < leastSUDTAccountCapacity, [cell.capacity])
  const [type, setType] = useState<string>('')

  const handleClick = (e: React.SyntheticEvent<HTMLDivElement>) => setType(e.currentTarget.dataset.type ?? '')
  const handleCancel = () => {
    setType('')
    onCancel()
  }

  return (
    <Dialog
      className={styles.container}
      show={isDialogOpen}
      title={t('migrate-sudt.title')}
      onCancel={handleCancel}
      cancelText={t('migrate-sudt.cancel')}
      confirmText={t('migrate-sudt.next')}
      confirmProps={{ onClick: () => openDialog?.(type) }}
      disabled={!type}
    >
      <>
        <div className={styles.chooseTitle}>{t('migrate-sudt.choose-title')}</div>
        {items.map((v, idx) => (
          <div
            key={v.title}
            data-type={v.type}
            className={`${isNewSUDTAccountDisabled && idx === 0 ? styles.disabled : ''} ${styles.actionContainer} ${
              v.type === type ? styles.active : ''
            } `}
            onClick={isNewSUDTAccountDisabled && idx === 0 ? undefined : handleClick}
            onKeyPress={() => {}}
            role="button"
            tabIndex={idx}
          >
            <div className={styles.title}>{t(v.title)}</div>
            <div className={styles.subTitle}>{t(v.subTitle)}</div>
          </div>
        ))}
      </>
    </Dialog>
  )
}

SUDTMigrateDialog.displayName = 'SUDTMigrateDialog'

export default SUDTMigrateDialog
