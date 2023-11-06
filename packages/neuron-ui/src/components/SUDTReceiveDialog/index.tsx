import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { addressToScript, bech32Address, AddressPrefix } from '@nervosnetwork/ckb-sdk-utils'
import SUDTAvatar from 'widgets/SUDTAvatar'
import { AddressTransformWithCopyZone } from 'components/Receive'
import QRCode, { copyCanvas, downloadCanvas } from 'widgets/QRCode'
import Dialog from 'widgets/Dialog'
import Button from 'widgets/Button'
import Alert from 'widgets/Alert'

import { CONSTANTS } from 'utils'
import { getDisplayName, getDisplaySymbol } from 'components/UANDisplay'
import styles from './sUDTReceiveDialog.module.scss'

const { DEFAULT_SUDT_FIELDS } = CONSTANTS
const toShortAddr = (addr: string) => {
  try {
    const script = addressToScript(addr)
    const isMainnet = addr.startsWith(AddressPrefix.Mainnet)
    return bech32Address(script.args, {
      prefix: isMainnet ? AddressPrefix.Mainnet : AddressPrefix.Testnet,
      codeHashOrCodeHashIndex: '0x02',
    })
  } catch {
    return ''
  }
}

export interface DataProps {
  address: string
  accountName: string
  tokenName: string
  symbol: string
}

const SUDTReceiveDialog = ({ data, onClose }: { data: DataProps; onClose?: () => void }) => {
  const [t] = useTranslation()
  const [isInShortFormat, setIsInShortFormat] = useState(false)
  const { address, accountName, tokenName, symbol } = data
  const ref = useRef<HTMLDivElement | null>(null)
  const onDownloadQrCode = useCallback(() => {
    const canvasElement = ref.current?.querySelector('canvas')
    if (canvasElement) {
      downloadCanvas(canvasElement)
    }
  }, [ref])
  const [showCopySuccess, setShowCopySuccess] = useState(false)
  const onCopyQrCode = useCallback(() => {
    setShowCopySuccess(false)
    const canvasElement = ref.current?.querySelector('canvas')
    if (canvasElement) {
      copyCanvas(canvasElement)
      setTimeout(() => {
        setShowCopySuccess(true)
      }, 1)
    }
  }, [ref])

  const displayedAddr = isInShortFormat ? toShortAddr(address) : address

  return (
    <Dialog
      show
      title={t('s-udt.account-list.receive')}
      onCancel={onClose}
      showFooter={false}
      contentClassName={styles.contentClassName}
    >
      <div className={styles.container}>
        <Alert status="warn" className={styles.notification}>
          <span>{t('s-udt.receive.notation', { symbol: getDisplaySymbol(tokenName || '', symbol || '') })}</span>
        </Alert>
        <div className={styles.info}>
          <SUDTAvatar type="logo" />
          <div className={styles.right}>
            <div className={styles.accountName}>{accountName || DEFAULT_SUDT_FIELDS.accountName}</div>
            <div className={styles.tokenName}>
              <span>
                {getDisplayName(tokenName || DEFAULT_SUDT_FIELDS.tokenName, symbol)}
                {` (${symbol || DEFAULT_SUDT_FIELDS.symbol})`}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.qrCode} data-copy-success={showCopySuccess} data-copy-success-text={t('common.copied')}>
          <QRCode value={displayedAddr} size={128} includeMargin ref={ref} />
        </div>
        <div className={styles.copyContainer}>
          <AddressTransformWithCopyZone
            className={styles.copyTransformWrapper}
            showAddress={displayedAddr}
            isInShortFormat={isInShortFormat}
            onClick={() => setIsInShortFormat(is => !is)}
          />
        </div>
        <div className={styles.actions}>
          <Button type="default" label={t('receive.copy-qr-code')} onClick={onCopyQrCode} />
          <Button type="confirm" label={t('receive.save-qr-code')} onClick={onDownloadQrCode} />
        </div>
      </div>
    </Dialog>
  )
}

SUDTReceiveDialog.displayName = 'SUDTReceiveDialog'

export default SUDTReceiveDialog
