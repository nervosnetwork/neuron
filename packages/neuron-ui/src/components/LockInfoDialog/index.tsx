import { useTranslation } from 'react-i18next'
import React, { useCallback, useState, useRef } from 'react'
import { bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import CopyZone from 'widgets/CopyZone'
import { ReactComponent as Copy } from 'widgets/Icons/TinyCopy.svg'
import { ReactComponent as Check } from 'widgets/Icons/Check.svg'
import { useDialog } from 'utils'
import styles from './lockInfoDialog.module.scss'
import getLockSupportShortAddress from '../../utils/getLockSupportShortAddress'

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
      <h2 title={t('transaction.deprecated-address-format')} className={styles.title}>
        {t('transaction.deprecated-address-format')}
      </h2>
      <div style={{ marginBottom: 10 }}>
        <CopyZone content={shortAddr} name={t('history.copy-address')}>
          <span>{shortAddr}</span>
        </CopyZone>
      </div>
    </>
  )
}

const LockInfoDialog = ({ lockInfo, isMainnet, onDismiss }: LockInfoDialogProps) => {
  const [t] = useTranslation()
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  useDialog({ show: !!lockInfo, dialogRef, onClose: onDismiss })

  const timer = useRef<ReturnType<typeof setTimeout>>()

  const onDialogClicked = useCallback(
    (e: any) => {
      if (e.target.tagName === 'DIALOG') {
        onDismiss()
      }
    },
    [onDismiss]
  )
  if (!lockInfo) {
    return null
  }

  const rawLock = `{
  "code_hash": "${lockInfo.codeHash}",
  "hash_type": "${lockInfo.hashType}",
  "args": "${lockInfo.args}"
}`

  const handleCopy = () => {
    setCopied(true)
    window.navigator.clipboard.writeText(rawLock)

    clearTimeout(timer.current!)
    timer.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} role="presentation" onClick={e => onDialogClicked(e)}>
      <div className={styles.container}>
        <h2 title={t('transaction.lock-script')} className={styles.title}>
          {t('transaction.lock-script')}
        </h2>
        <div className={styles.lock}>
          <div
            className={styles.copyBtn}
            onClick={handleCopy}
            onKeyPress={e => (e.key === 'enter' ? handleCopy : undefined)}
            role="none"
          >
            {copied ? <Check /> : <Copy />}
          </div>
          <pre>{rawLock}</pre>
        </div>
        <ShortAddr isMainnet={isMainnet} lockScript={lockInfo} />
      </div>
    </dialog>
  )
}

LockInfoDialog.displayName = 'LockInfoDialog'

export default LockInfoDialog
