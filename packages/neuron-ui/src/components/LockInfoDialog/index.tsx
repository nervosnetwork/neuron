import { useTranslation } from 'react-i18next'
import React, { useState, useRef, useMemo } from 'react'
import { bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import { ReactComponent as Copy } from 'widgets/Icons/TinyCopy.svg'
import { ReactComponent as Check } from 'widgets/Icons/Check.svg'
import { onEnter } from 'utils/inputDevice'
import Dialog from 'widgets/Dialog'
import styles from './lockInfoDialog.module.scss'
import getLockSupportShortAddress from '../../utils/getLockSupportShortAddress'

interface LockInfoDialogProps {
  lockInfo: CKBComponents.Script | null
  isMainnet: boolean
  onDismiss: () => void
}

const getShortAddr = ({ lockScript, isMainnet }: { lockScript: CKBComponents.Script | null; isMainnet: boolean }) => {
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

  return shortAddr
}

const LockInfoDialog = ({ lockInfo, isMainnet, onDismiss }: LockInfoDialogProps) => {
  const [t] = useTranslation()
  const [copied, setCopied] = useState(false)

  const timer = useRef<ReturnType<typeof setTimeout>>()

  const rawLock = lockInfo
    ? `{
  "code_hash": "${lockInfo.codeHash}",
  "hash_type": "${lockInfo.hashType}",
  "args": "${lockInfo.args}"
}`
    : ''
  const shortAddr = useMemo(() => getShortAddr({ lockScript: lockInfo, isMainnet }) ?? '', [lockInfo, isMainnet])

  const handleCopy = (text: string) => {
    setCopied(true)
    window.navigator.clipboard.writeText(text)

    clearTimeout(timer.current!)
    timer.current = setTimeout(() => {
      setCopied(false)
    }, 1000)
  }

  return (
    <Dialog
      show={Boolean(lockInfo)}
      contentClassName={styles.content}
      title={t('lock-info-dialog.address-info')}
      onCancel={onDismiss}
      footer=""
    >
      <>
        <div className={styles.title}>{t('transaction.lock-script')}</div>
        <div className={styles.codeBlock}>
          <div
            className={styles.copyBtn}
            onClick={() => handleCopy(rawLock)}
            onKeyPress={onEnter(() => handleCopy(rawLock))}
            role="none"
          >
            {copied ? <Check /> : <Copy />}
          </div>
          <pre>{rawLock}</pre>
        </div>

        <div className={styles.title}>{t('lock-info-dialog.deprecated-address')}</div>
        <div className={styles.codeBlock}>
          <div
            className={styles.copyBtn}
            onClick={() => handleCopy(shortAddr)}
            onKeyPress={onEnter(() => handleCopy(shortAddr))}
            role="none"
          >
            {copied ? <Check /> : <Copy />}
          </div>
          <pre>{shortAddr}</pre>
        </div>
      </>
    </Dialog>
  )
}

LockInfoDialog.displayName = 'LockInfoDialog'

export default LockInfoDialog
