import { useTranslation } from 'react-i18next'
import React, { useCallback, useRef } from 'react'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import { useDialog } from 'utils'
import { scriptToAddress } from '@nervosnetwork/ckb-sdk-utils'
import styles from './lockInfoDialog.module.scss'
import getLockSupportShortAddress from '../../utils/getLockSupportShortAddress'

interface LockInfoDialog {
  lockInfo: CKBComponents.Script | null
  isMainnet: boolean
  onDismiss: () => void
}

const LockInfoDialog = ({ lockInfo, isMainnet, onDismiss }: LockInfoDialog) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: !!lockInfo, dialogRef, onClose: onDismiss })

  const onDialogClicked = useCallback(
    (e: any) => {
      if (e.target.tagName === 'DIALOG') {
        onDismiss()
      }
    },
    [onDismiss]
  )

  const renderFullVersionAddress = useCallback(() => {
    if (!lockInfo || !getLockSupportShortAddress(lockInfo)) {
      return null
    }
    const fullVersionAddress = scriptToAddress(lockInfo, isMainnet)
    return (
      <>
        <h2 title={t('transaction.full-version-address')} className={styles.title}>
          {t('transaction.full-version-address')}
        </h2>
        <div className={styles.fullVersionAddress}>
          <CopyZone content={fullVersionAddress} name={t('history.copy-address')}>
            {fullVersionAddress}
          </CopyZone>
        </div>
      </>
    )
  }, [lockInfo, isMainnet, t])

  return (
    <dialog ref={dialogRef} className={styles.dialog} role="presentation" onClick={e => onDialogClicked(e)}>
      <div className={styles.container}>
        <h2 title={t('transaction.lock-script')} className={styles.title}>
          {t('transaction.lock-script')}
        </h2>
        <div className={styles.addressDetailWrap}>
          {lockInfo && (
            <ul className={styles.infoWrap}>
              <li>
                <div>code_hash:</div>
                <div>{lockInfo.codeHash}</div>
              </li>
              <li>
                <div>hash_type:</div>
                <div>{lockInfo.hashType}</div>
              </li>
              <li>
                <div>args:</div>
                <div>{lockInfo.args}</div>
              </li>
            </ul>
          )}
        </div>
        {renderFullVersionAddress()}
        <div className={styles.footer}>
          <Button type="cancel" onClick={onDismiss} label={t('common.close')} />
        </div>
      </div>
    </dialog>
  )
}

LockInfoDialog.displayName = 'LockInfoDialog'

export default LockInfoDialog
