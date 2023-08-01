import { useTranslation } from 'react-i18next'
import React, { useCallback, useRef, useState } from 'react'
import { bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import Dialog from 'widgets/Dialog'
import { useDialog } from 'utils'
import { Copy } from 'widgets/Icons/icon'
import Alert from 'widgets/Alert'
import getLockSupportShortAddress from '../../utils/getLockSupportShortAddress'

import styles from './lockInfoDialog.module.scss'

interface LockInfoDialogProps {
  lockInfo: CKBComponents.Script | null
  isMainnet: boolean
  onDismiss: () => void
}

const useCopy = () => {
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const [copied, setCopied] = useState(false)
  const [refreshKey, setRefreshKey] = useState(1)
  const onCopy = useCallback(
    (content: string) => {
      setRefreshKey(key => key + 1)
      setCopied(true)
      window.navigator.clipboard.writeText(content)
      clearTimeout(timer.current!)
      timer.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
    },
    [timer]
  )
  return {
    copied,
    onCopy,
    refreshKey,
  }
}

const ShortAddr = ({
  lockScript,
  isMainnet,
  onCopy,
}: {
  lockScript: CKBComponents.Script | null
  isMainnet: boolean
  onCopy: (content: string) => void
}) => {
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
      <div className={styles.shortAddr}>
        <span>{shortAddr}</span>
        <Copy className={styles.copyIcon} onClick={() => onCopy(shortAddr)} />
      </div>
    </>
  )
}

const LockInfoDialog = ({ lockInfo, isMainnet, onDismiss }: LockInfoDialogProps) => {
  const [t] = useTranslation()
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: !!lockInfo, dialogRef, onClose: onDismiss })
  const { copied, onCopy, refreshKey } = useCopy()

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
          <pre>{rawLock}</pre>
          <Copy className={styles.copyIcon} onClick={() => onCopy(rawLock)} />
        </div>
        <ShortAddr isMainnet={isMainnet} lockScript={lockInfo} onCopy={onCopy} />
        {copied ? (
          <Alert status="success" className={styles.notice} key={refreshKey.toString()}>
            {t('common.copied')}
          </Alert>
        ) : null}
      </div>
    </Dialog>
  )
}

LockInfoDialog.displayName = 'LockInfoDialog'

export default LockInfoDialog
