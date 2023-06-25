import React, { useCallback, useState } from 'react'
import VerifyHardwareAddress from 'components/VerifyHardwareAddress'
import Button from 'widgets/Button'
import { useTranslation } from 'react-i18next'
import QRCode from 'widgets/QRCode'
import CopyZone from 'widgets/CopyZone'
import { AddressTransform } from 'widgets/Icons/icon'
import { ReactComponent as Download } from 'widgets/Icons/Download.svg'
import { ReactComponent as Copy } from 'widgets/Icons/Copy.svg'
import { useCopyAndDownloadQrCode, useSwitchAddress } from './hooks'
import styles from './receive.module.scss'

const SignleAddressReceive = ({ address, wallet }: { address: string; wallet: State.Wallet }) => {
  const [t] = useTranslation()
  const [displayVerifyDialog, setDisplayVerifyDialog] = useState(false)
  const onVerifyAddressClick = useCallback(() => {
    setDisplayVerifyDialog(true)
  }, [])
  const { isInShortFormat, setIsInShortFormat, address: showAddress } = useSwitchAddress(address)
  const { ref, showCopySuccess, onCopyQrCode, onDownloadQrCode } = useCopyAndDownloadQrCode()
  const stopPropagation = useCallback((e: React.SyntheticEvent) => {
    e.stopPropagation()
  }, [])
  return (
    <div className={styles.singleAddressRoot}>
      {displayVerifyDialog && (
        <VerifyHardwareAddress
          address={address}
          wallet={wallet}
          onDismiss={() => {
            setDisplayVerifyDialog(false)
          }}
        />
      )}
      <div className={styles.qrCode} data-copy-success={showCopySuccess} data-copy-success-text={t('common.copied')}>
        <QRCode value={showAddress} size={128} includeMargin ref={ref} />
      </div>
      <div className={styles.copyContainer}>
        <CopyZone content={showAddress} name={t('receive.copy-address')} className={styles.copyAddress}>
          {showAddress}
          <button
            type="button"
            className={styles.addressToggle}
            onClick={() => setIsInShortFormat(is => !is)}
            title={t(isInShortFormat ? `receive.turn-into-full-version-fomrat` : `receive.turn-into-deprecated-format`)}
            onFocus={stopPropagation}
            onMouseOver={stopPropagation}
            onMouseUp={stopPropagation}
          >
            <AddressTransform />
          </button>
        </CopyZone>
      </div>
      <Button
        type="primary"
        label={t('receive.verify-address')}
        onClick={onVerifyAddressClick}
        className={styles.verifyAddress}
      />
      <div className={styles.actions}>
        <Button type="text" label={t('receive.save-qr-code')} onClick={onDownloadQrCode}>
          <>
            <Download />
            {t('receive.save-qr-code')}
          </>
        </Button>
        <Button type="text" label={t('receive.copy-qr-code')} onClick={onCopyQrCode}>
          <>
            <Copy />
            {t('receive.copy-qr-code')}
          </>
        </Button>
      </div>
    </div>
  )
}

SignleAddressReceive.displayName = 'SignleAddressReceive'

export default SignleAddressReceive
