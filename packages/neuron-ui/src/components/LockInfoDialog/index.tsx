import { useTranslation } from 'react-i18next'
import React, { useRef } from 'react'
import { bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import CopyZone from 'widgets/CopyZone'
import Dialog from 'widgets/Dialog'
import { useDialog } from 'utils'
import { ReactComponent as Copy } from 'widgets/Icons/Copy.svg'
import getLockSupportShortAddress from '../../utils/getLockSupportShortAddress'

import styles from './lockInfoDialog.module.scss'

interface LockInfoDialogProps {
  lockInfo: CKBComponents.Script | null
  isMainnet: boolean
  onDismiss: () => void
}

const ShortAddr = ({ lockScript, isMainnet }: { lockScript: CKBComponents.Script | null; isMainnet: boolean }) => {
  const [t] = useTranslation()

  if (!lockScript) {
    return null
  }

  const lock = getLockSupportShortAddress(lockScript)
  if (!lock) {
    return null
  }

  const shortAddr = bech32Address(lockScript.args, {
    prefix: isMainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet,
    codeHashOrCodeHashIndex: lock.CodeHashIndex,
  })

  return (
    <>
      <div title={t('transaction.deprecated-address-format')} className={styles.title}>
        {t('transaction.deprecated-address-format')}
      </div>
      <CopyZone content={shortAddr} className={styles.copyContent}>
        <div>{shortAddr}</div>
        <Copy />
      </CopyZone>
    </>
  )
}

const LockInfoDialog = ({ lockInfo, isMainnet, onDismiss }: LockInfoDialogProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: !!lockInfo, dialogRef, onClose: onDismiss })

  if (!lockInfo) {
    return null
  }

  const rawLock = `{
    "code_hash": "${lockInfo.codeHash}",
    "hash_type": "${lockInfo.hashType}",
    "args": "${lockInfo.args}"
  }`

  return (
    <Dialog
      show={Boolean(lockInfo)}
      contentClassName={styles.content}
      title={t('lock-info-dialog.address-info')}
      onCancel={onDismiss}
      showFooter={false}
    >
      <div className={styles.container}>
        <div title={t('transaction.lock-script')} className={`${styles.title} ${styles.lockScriptTitle}`}>
          {t('transaction.lock-script')}
        </div>
        <div className={styles.lock}>
          <CopyZone content={rawLock}>
            <Copy className={styles.copyBtn} />
            <pre>{rawLock}</pre>
          </CopyZone>
        </div>
        <ShortAddr isMainnet={isMainnet} lockScript={lockInfo} />
      </div>
    </Dialog>
  )
}

LockInfoDialog.displayName = 'LockInfoDialog'

export default LockInfoDialog
