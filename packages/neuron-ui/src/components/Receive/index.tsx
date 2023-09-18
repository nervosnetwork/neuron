import React, { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useState as useGlobalState } from 'states'
import Dialog from 'widgets/Dialog'
import Toast from 'widgets/Toast'
import Button from 'widgets/Button'
import CopyZone from 'widgets/CopyZone'
import QRCode from 'widgets/QRCode'
import Tooltip from 'widgets/Tooltip'
import { AddressTransform, Download, Copy, Attention } from 'widgets/Icons/icon'
import VerifyHardwareAddress from './VerifyHardwareAddress'
import styles from './receive.module.scss'
import { useCopyAndDownloadQrCode, useSwitchAddress } from './hooks'

type AddressTransformWithCopyZoneProps = {
  showAddress: string
  isInShortFormat: boolean
  className?: string
  onClick: () => void
}

export const AddressTransformWithCopyZone = ({
  showAddress,
  isInShortFormat,
  onClick,
  className,
}: AddressTransformWithCopyZoneProps) => {
  const [t] = useTranslation()
  const transformLabel = t(
    isInShortFormat ? 'receive.turn-into-full-version-format' : 'receive.turn-into-deprecated-format'
  )

  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])

  return (
    <div className={className}>
      <CopyZone content={showAddress} className={styles.showAddress}>
        {showAddress}
      </CopyZone>
      <button
        type="button"
        className={styles.addressToggle}
        onClick={onClick}
        title={transformLabel}
        onFocus={stopPropagation}
        onMouseOver={stopPropagation}
        onMouseUp={stopPropagation}
      >
        <AddressTransform />
        {transformLabel}
      </button>
    </div>
  )
}

const Receive = ({ onClose, address }: { onClose?: () => void; address?: string }) => {
  const [t] = useTranslation()
  const { wallet } = useGlobalState()
  const { addresses } = wallet
  const isSingleAddress = addresses.length === 1

  const accountAddress = useMemo(() => {
    if (isSingleAddress) {
      return addresses[0].address
    }
    return (address || addresses.find(a => a.type === 0 && a.txCount === 0)?.address) ?? ''
  }, [address, addresses, isSingleAddress])

  if (!accountAddress) {
    return <div>{t('receive.address-not-found')}</div>
  }

  const { isInShortFormat, setIsInShortFormat, address: showAddress } = useSwitchAddress(accountAddress)
  const { ref, onCopyQrCode, onDownloadQrCode, showCopySuccess } = useCopyAndDownloadQrCode()

  return (
    <Dialog
      show
      title={
        <Tooltip tip={<div className={styles.tip}>{t('receive.prompt')}</div>} placement="right-bottom">
          <div className={styles.dialogTitle}>
            {t('receive.title')}
            <Attention />
          </div>
        </Tooltip>
      }
      onCancel={onClose}
      showFooter={false}
      className={styles.dialog}
    >
      <div className={styles.addressRoot}>
        <div className={styles.qrCode} data-copy-success-text={t('common.copied')}>
          <QRCode value={showAddress} size={128} includeMargin ref={ref} />
        </div>

        <div className={styles.actions}>
          <Button type="text" onClick={onDownloadQrCode}>
            <Tooltip tip={t('receive.save-qr-code')} placement="top">
              <Download />
            </Tooltip>
          </Button>
          <Button type="text" onClick={onCopyQrCode}>
            <Tooltip tip={t('receive.copy-address')} placement="top">
              <Copy />
            </Tooltip>
          </Button>
        </div>
        <div className={styles.copyAddress}>
          <AddressTransformWithCopyZone
            showAddress={showAddress}
            isInShortFormat={isInShortFormat}
            onClick={() => setIsInShortFormat(is => !is)}
          />
        </div>

        {isSingleAddress && <VerifyHardwareAddress address={accountAddress} wallet={wallet} onClose={onClose} />}
      </div>

      {showCopySuccess && <Toast content={t('common.copied')} />}
    </Dialog>
  )
}

Receive.displayName = 'Receive'

export default Receive
